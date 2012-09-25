/*
  一个简单前端模版引擎 Jot.Tiny
  作者：蜗眼 <iceet@uoeye.com>
 
 模版例子：
 渲染数据：{title:'asfd',data:[{link:'//www.baidu.com',clink:1,name:'title'}]}
 模版结构：
 <dl>
	 <dt>｛/$title/｝</dt>
	 {/foreach $data as $item/}
		<dd>
		{/if $item.link/}
			{/plugin baidu $item.c|2|3/}
		{/elseif $item.clink == 2 /}
		{//if/}
		</dd>
	 {//foreach/}
 </dl>
 支持语法:
	
	//注意 对原生语法的支持
	1、foreach 语法  foreach $data as $item || foreach ($data as $item)
	2、if-else 语法  if $data == 2 || if ($data == 2) || elseif $data == 1 || else || /if 
	3、plugin 语法 plugin baidu $dasdf:12 | $data|baidu:23,$asdf,1 注意这里的管道（‘|’）语法 将前面的输出应用到后面的插件的输入 分好后面是传入参数
	4、赋值语法，定义变量 {/var $baidu = $asdf /}  || {/assign $baidu=eeeee/} ||  {/$baidu=233/}
	
	5、函数定义function 和插件类似，只是作用域在该模版下。exports 导出该函数？？
	{/function name=menu level=0 exports/}
	  <ul class="level{/$level/}">
	  {/foreach $data as $entry/}
		{/if is_array($entry)/}
		  <li>{/$entry.key/}</li>
		  {/call name=menu data=$entry level=$level+1/}
		{/else/}
		  <li>{/$entry/}</li>
		{//if/}
	  {//foreach/}
	  </ul>
	{//function/}
	
	6、函数调用call 调用通过function关键字定义的函数 level 表示调用层级,这种可以解决那个循环嵌套问题
	{/call name=menu data=$menu level=$level+1/}
	
	//预定义常量
	1、$$index 在foreach语法中可以访问当前循环的索引下标,调用方法有$index,$index[1]//在多重循环里面调用
	2、$$item  在foreach语法中访问当前项 $$item[1] //在多重循环中有用
	3、$$arguments 访问传入参数arguments对象，在做插件的时候有用 只一个数组	
 */
 define('Jot.Tiny',function(){
 
 var Tiny     = function (){},
	uuid      = 1E2,
	plugin    = {},//插件
			  
	//正则部分
	//正则处理，这里的是语法提取正则
	rsegmt    = /(.*?)\{\/\s*(.*?)\s*\/\}/gm,//关键的分割正则
	rlevel	  = /(?:^|[^\w\s]*)(\$level)(?:[^\w\s]*|$)/g,
	rpredef	  = /\$\$(index|arguments|item|data)(?:\[(\d+)\])?/g,
	rvalue    = /(?:\$(\w+))/g,
	rfirst	  = /^(\w+|[^\w]+)/,//提取第一个关键词语
	rforeach  = /^foreach\s*\(?\s*([\$\w\.\[\]]+)\s+as\s+\$([\$\w]+)/,//switch 语法
	rfor	  = /^for\s*\(?\s*([^){]+)\s*/,//for 语法
	rfunction = /^function\s+name\s*=\s*['"]?(\w+)['"]?\s*(?:level\s*=\s*([^\s]+))?\s*(exports)?/,//function 语法
	rcall 	  = /^call\s+name\s*=\s*(\w+)\s*(?:data\s*=\s*([\$\w\.\[\]]+))?\s*(?:level\s*=\s*([^\s]+))?/,//call 语法
	rif		  = /^if\s+\(?([^)\s{]+)/,//if语法
	relseif	  = /^elseif\s+\(?([^)\s{]+)/,//elseif 语法
	relse	  = /^else$/,//else语法
	rassign	  = /^(?:(?:var|assign)\s*)\$?([\w]+)\s*=\s*([$\w]+)/,//赋值语法
	rplugin	  = /^(?:include|plugin)\s+(\w+)\s+([\$\w\.]+)(?::([\$\w,]+)?)/,//插件语法
	rpiping	  = /([\$\w]+)([\w:,]+)/g;//插件语法管道
	
	
	Tiny.prototype = {
		//编译函数
		compiler: function( template ,remain){
			
			Tiny.compiled  = [];//编译结果缓存
			
			Tiny.funp	   = -1;
			Tiny.incode    = 0;
			Tiny.loopindex = 0;
			Tiny.loopitem  = [];
			Tiny.assign	   = {};//变量列表
			Tiny.loop 	   = 0 ;//循环层级
			
			remain = template.replace(/\n/g,'')
						.replace(rsegmt,function(_,metacr,statement){
				
				var syntax ,match ,result = '' ,force;
				
				if (metacr !== undefined){
			
					Tiny.incode ? Tiny.compiled.push(metacr) 
						: Tiny.compiled.push(Tiny.concats(metacr));
				}
				if ( match = statement.match(rfirst) ) {
					if ( syntax = Tiny.syntax[match[1]] ){
						//修正
						if ( typeof syntax == 'string' ) {
							syntax = Tiny.syntax[syntax];
						}
						result = syntax ( statement );
					} else {
						//修正赋值语句
						if ( match[1] == 'var' ) {
							result = Tiny.syntax.assign(statement);
						}
					}
				}
				return result && Tiny.compiled.push(result) , '';
			});
			
			return Tiny.resolve(remain && Tiny.compiled.push( Tiny.concats(remain) ));
		},
		//解析，编译
		resolve: function(force){
			
			var result =['var __index__=[],__plugin__=window.TinyPlugin,__item__=[],',
					'__arguments__=arguments;',Tiny.concats()];
			
			if (force === true){
				return result.join('');
			}
			result.push(Tiny.compiled.join(''));
			result.push(Tiny.concats(true));
			
			//window.console && console.log(result.join(''));
			return new Function('__data__',result.join(''));
		},
		//语法,也就是开始的单词
		syntax: {
			'/': 'end',
			'}': 'end',
			'$': 'value',
			'=': 'value',
			'include': 'plugin',
			//__index__,__item__,__data__,__arguments__,__plugin__
			//这个处理foreach
			'foreach': function(statement,match){
			
				var result=['for(var '];
				
				if ( match = statement.match(rforeach) ){
					var loop = Tiny.funp>-1 ? ++Tiny.funp : ++Tiny.loop,
						syn  = [(syn=match[2])+'__D',syn+'__I',syn+'__L'];
					
					result.push(syn[0],'=','__item__[',loop,']=',Tiny.syntax.value(match[1],true));
					result.push(',',syn[2],'=',syn[0],'.length');
					result.push(',',syn[1],'= 0;',syn[1],'<',syn[2],';','){var ');
					result.push(match[2],'=',syn[0],'[',syn[1],'++];__index__[',loop,']=',syn[1],';');
					
					Tiny.loopindex = syn[1];
					Tiny.loopitem .push( match[2]);
					
					return result.join('');
				}
			},
			//for 语法
			'for': function(statement,match){
			
				if ( match = statement.match( rfor )){
					return 'for('+Tiny.syntax.value(match[1],true)+'){';
				}
			},
			//function 语法
			'function': function(statement,match){
				
				var result = ['function __function__'];
				
				if ( match = statement.match(rfunction) ) {
					
					result.push(match[1],'(__data__,level){');
					result.push('level=level || ',match[2] || 0,';');
					
					//标记进入function语法
					Tiny.funp = 0;
					return result.push(Tiny.resolve(true)),result.join('');
				}
			},
			//call语法
			'call': function(statement,match){
				
				var result = ['__function__'],argumens='';
				
				if ( match = statement.match(rcall) ) {
					if ( match[2] == undefined ){
						result.push(match[1],'()');
					}else{
						result.push(match[1],'(',
							Tiny.syntax.value(match[2],true)||'""',',',
							Tiny.syntax.value(match[3],true)||0,')');
					}
					return Tiny.concats(result.join(''),true);
				}
			},
			//插入代码语法
			'code': function(statement){
				Tiny.incode =1;
			},
			//if 语法
			'if': function(statement,match){
			
				if ( match = statement.match(rif) ){
					return 'if('+Tiny.syntax.value(match[1],true)+'){';
				}
			},
			//else 语法
			'else': function (statement){
			
				if ( statement.match(relse) ){
					return '}else{';
				}
			},
			//elseif 语法
			'elseif': function(statement,match){
			
				if (match = statement.match(relseif)){
					return '}else if('+Tiny.syntax.value(match[1],true)+'){';
				}
			},
			//赋值语法，注意变种
			'assign': function(statement,match){
			
				if (match = statement.match(rassign)){
					Tiny.assign[match[1]] = 1;
					return 'var '+match[1]+'='+Tiny.syntax.value(match[2],true)+';'
				}
			},
			//插件调用语法
			'plugin': function(statement){
				
				//单个插件
				if ( match = statement.match(rplugin) ) {
					
					return Tiny.concats('__plugin__(\''+match[1]+'\')('+
						Tiny.syntax.value(match[2],true)+','+
						Tiny.syntax.value(match[3],true)+')',true);
				//管道语法		
				} else if (match = statement.match(rpiping)) {
				
					var idx  = 0, item ,syntax,
						head = Tiny.syntax.value(match.shift(),true);
					
					while(item = match.shift()){
						syntax  = item.split(':');
						head 	= '__plugin__(\''+syntax[0]+'\')('+
							head+(syntax[1]?','+Tiny.syntax.value(syntax[1],true):'')+")";
						
						///result  += head;
					}
					return Tiny.concats(head,true);
				}				
			},
			//处理结束语法 /foreach /if /for /function
			'end': function(statement){
				
				if (statement.indexOf('/function')>-1){
					Tiny.funp = -1;
					return Tiny.concats(true)+'}';
					
					} else if (statement.indexOf('/foreach') >-1){
					Tiny.loop--;
					Tiny.loopitem.pop();
					
				} else if (statement.indexOf('/code')>-1){
					Tiny.incode =0;
					return '';
				}
				return '}';
			},
			//处理取值语法 = $开头，这里面有可能有插件语法
			'value': function(statement,trux){
				
				if (statement !== undefined ){
					//处理混入的其他语法
					if ( trux == undefined ){
						if ( statement.indexOf('|')>-1 ) {//插件语法
							return Tiny.syntax.plugin(statement);
							} else if (statement.indexOf('=')>1){//
							return Tiny.syntax.assign(statement);
						}
					}
					//修正预定义常量
					statement.indexOf('$$')>-1  && (statement = Tiny.predefined(statement));
					//修正function里面的level变量
					if (Tiny.funp >-1){
						statement = statement.replace(rlevel,'level');
					}
					var assval = ","+Tiny.loopitem+',';
					statement = statement.replace(/^=/,'').replace(rvalue,function(_,$1){
						return  (Tiny.assign[$1] || assval.indexOf(','+$1+',')>-1)
							? $1 : '__data__.'+$1;
					});
				}
				
				return trux === undefined ? Tiny.concats(statement,true) : statement ;
			}
		},
		//处理预先定义语法
		predefined: function(statement){
			
			return statement.replace(rpredef,function(_,$1,$2){
				if ( $2 == undefined){
					switch ($1){
						case 'index':
							return Tiny.loopindex;
						case 'item':
							return Tiny.loopitem[Tiny.loopitem.length-1];
						default:
							return '__'+$1+'__';
					}
				}
				return '__'+$1+'__['+$2+']';
			});
		},
		//字符串连接
		concats: function(){
		
			return (''.trim ? ((''.trim+'').indexOf('return') >-1?0:1):0) 
				? function ( string , isfn ){
					return string == undefined 
						? 'var __out__="";' 
						: string === true ? 'return __out__;'
					: '__out__+=' + ( isfn?string:"'"+string+"'" ) + ';';
				} : function ( string , isfn ){
					return string ==undefined 
						? 'var __out__=[];'
						: string ===true ? 'return __out__.join("")'
					: '__out__.push(' + ( isfn?string:"'"+string+"'") +');'
			}
		}(),
		//插件
		plugin: function(name,template){
			
			if ( !template || plugin [name] ) {
				return plugin[name]|| function(){};
			}
			
			return pluain [name] = typeof template =='function' 
				? template : Tiny.compiler( template );
		}
	};
	
	Tiny = new Tiny;
	//全局插件调用
	window.TinyPlugin = Tiny.plugin;
	
	return function( template , name){
	
		if ( name !== undefined ) {
			return TinyPlugin(name,template);
		}
		return Tiny.compiler( template );
	}
 });
