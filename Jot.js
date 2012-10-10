(function(window){
/*
 * 简单选择器
 * 作者 : 蜗眼<iceet@uoeye.com>
 */
var Jot = function(selector,context,acall){
		if( !(this instanceof (acall=arguments.callee))) {
			
			return selector instanceof acall 
				?  selector :  new acall(selector,context);
		}
		this.init(selector,context || document);
	},
	uuid      = +new Date(),
	expando   ='jot'+uuid,
	//简单选择器
	rsimple   = /^([\.#]*)(\w+)$/,
	rcompose  = /\s*([>,\s])\s*/g,//组合，支持>,\s
	rselector = /([\.#]*)(\w*)(?:\[(\w+)=(\w+)\])?/ig,
	
	rhtml     = /(?:<[^>\/]*\/>)|(?:<[^>]*>.*<\/.*>)/g,
	rhtmlTag  = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
	rnotag    = /(^[^<]*|[^>]*$)/g,
	roften	  = /<\/(\w+)\s*>/g,
	
	TOSTRING = Object.prototype.toString,
	PUSH = Array.prototype.push;
	
	Jot.prototype = Jot.fn = {
		init: function(selector,context,match,result){
		
			if ( typeof selector !=='string') {

				if(selector && (selector.nodeType  || selector === window)){
					this[0] = selector.documentElement || selector;
					return this.length =1;
				//传入Node列表的情况
				} else if (selector.length){
					return this.CRUSH(selector,true);
				}
				//TODO deal other!
			} else {
				
				//处理HTML字符串
				if ( rhtml.test(selector) && (result =[])){
					selector = selector.replace(rhtmltag, '<$1></$2>')
						   .replace(rnotag, '');
					this.UNKNOWN(selector);
					Jot.assert(function(div,cr,e){
						div.innerHTML =  selector;
						for(var i=-1,d=div.childNodes,l=d.length;i<l;){
							d[++i].nodeType ==1 && result.push(d[i]);
						}
					});
				} else {
				
					//处理选择器的情况
					//是简单选择器 #id/.class/tag
					if ( match = selector.match(rsimple) ) {
						return this.CRUSH(this.META(match,context));
					}
					//处理组合选择器 div#id等情况
					//处理组合选择器的情况
					if (context.querySelectorAll){
						//return this.CRUSH(context.querySelectorAll(selector));
					}
				}
				return this.CRUSH( result || ((match=selector.split(rcompose)).length >1 
					 ? this.COMPOSE( match,context ) : this.FIND( selector,context )) ,true);
			}
		},
		META: function(match,context,self){
		
			if ( self == undefined ) {
				return match[1] ? match[1] == '#'
					? this.ID(context,match[2])
					: this.CLASS(context,match[2]) : this.TAG(context,match[2]);
			}
			//过滤自己
			return  (match[1] ? match[1] == '#' ? context.id == match[2]
						: (' '+context.className+' ').indexOf(' '+match[2]+' ')>-1 
						: context.nodeName.toLowerCase() == match[2].toLowerCase()) 
					? match[3] ? this.ATTR(match[3],context) == match[4] : true: false;
		},
		ID: function(context,name){
			if (Jot.BUGGY.fixid){
				var res = document.getElementById(id),
					ret = [],i=0,e;
					res = res.length ? res : [res];
				while(e = res[i++]){
					e.id == name && (ret.push(e));
				}
				return ret;
			}
			return [document.getElementById(name)];
		},
		CLASS: function(elem,name){
			if ( Jot.BUGGY.fixclass ) {
				var ret=[],res = elem.getElementsByTagName('*'),i=0,e;
					name = ' '+name+' ';
				while(e =res[i++]){
					-1<(' '+e.className+' ').indexOf(name) && ret.push(e);
				}
				return ret;
			}
			return elem.getElementsByClassName(name);
		},
		TAG: function(elem,name){
			return elem.getElementsByTagName(name);
		},
		ATTR: function(elem,name,val){
			if ( Jot.BUGGY.fixattr ){
				name = Jot.BUGGY.fixattr[name] || name;
				if(!val && 'href,src,'.indexOf(name+',')>-1){
					return elem.getAttribute(name,2);
				}
			}
			return val ? elem.setAttribute(name,val) 
				: elem.getAttribute(name);
		},
		//查找
		FIND: function(selector,context,itself){
			
			var mtch ,result = context,i=0,
				match = this.MATCH(selector);
			
			while( mtch=match[i++] ){
				result = this.FILTER(mtch,result,
						itself || (i>1 ? true: !!itself));
			}
			return result;
		},
		MATCH: function(){
			var cache = {};
			return function(selector,match){
				
				if ( !(match = cache[selector]) && (match=[]) ){
					selector.replace(rselector,function(_,$1,$2,$3,$4){
						_ && match.push(['',$1,$2,$3,$4]);
					});
				}
				return match;
			}
		}(),
		//遍历
		ITERATE: function(result,iterate,argus){
			
			var i=0,e,ret=[],crt;
			
			while(e = result[i++]){
				if (e.nodeType!==3 && (crt = iterate(i,e,argus)) ) {
					crt.length == undefined ? ret.push(crt) : this.PUSH(ret,crt);
				}
			}
			return ret;
		},
		//过滤
		FILTER: function(match,context,itself,reverse){
			var consult = context.length == undefined ? [context] : context , 
				result  = [],rtv, jot = this;
			
			if ( consult.length ){
				if ( false == itself ) {
					this.ITERATE(consult,function(idx,item){
						if( (item = jot.META(match,item)) && item.length ) {
							//过滤属性
							if (undefined != match[3] ) {
								item = jot.ITERATE(item,function(i,e){
									return jot.ATTR(e,match[3]) == match[4];
								});
							}
							return jot.PUSH(result,item);
						}
					});
				//自生过滤
				} else {
					this.ITERATE(consult,function(idx,item){
						if ( item.nodeType ==1 && (jot.META(match,item,true) )){
							
							result.push(item);
						}
					});
				}
			}
			
			return result;
		},
		//组合选择器
		COMPOSE: function(match,context){
		
			var result = [] , supper = null,mch;
			
			for(var i=0,len=match.length;i<len;i++){
				switch ( mch = match[i] ) {
					case '>':
						supper = this.FIND(match[++i],
							this.ITERATE(supper,function(idx,item){
								return item.childNodes;
						}),true);
						break;
					case ',':
						this.PUSH(result,supper) , supper = this.FIND(match[++i],context);
						break;
					default:
						supper = this.FIND(match[mch ==' '?++i:i],context);
				}
			}
			return supper  ? this.PUSH(result,supper) : result;
		},
		//对IE6添加对自定义标签的支持
		UNKNOWN: function(){
			var cache ={};
			return function(html){
				if (Jot.BUGGY.fixcustom ){
					html.replace(roften,function(_,$1){
						cache[$1] || (cache[$1]=1)&& document.createElement($1);
					})
				}
			}
		}(),
		//遍历result
		CRUSH: function( result , unque){
		
			if(result.length){
				var idx = this.length-1,e;
					unque && (result= this.UNIQUE(result));
				while(e = result[++idx]){
					if(e.nodeType === 1){
						this[idx] = e;
					}
				}
				this.length = idx;
			}
			return this;
		},
		//压入结构
		PUSH: function(target,source){
			try{
				PUSH.apply(target,source);
			}catch(e){
				var i = 0,l=target.length || 0;
				while ( e=source[i++] ) {
					target[ l++ ]= e ;
				}
			}
			return target;
		},
		//去掉重复
		UNIQUE: function(node){
			
			if( node.length < 2 ) {
				return node;
			}
			var i = 0,elem,
				hasDuplicate  = false,
				len= node.length;
			//for ie
			if(node[0].sourceIndex){
				var ceme =[],cache ={},ret=[],j=0,index;
				while(elem = node[i++]){
					index = elem.sourceIndex;
					if(!cache[index]){
						ceme[j++] = index;
						cache[index] = elem;
					}
				}
				ceme.sort();
				while( --j ){
					ret[j] == cache[ceme[j]];
				}
				return (ceme = null) || ret;
			}
			node.sort(function(a,b){
				if(a===b){
					hasDuplicate = true;
					return 0;
				}
				return a.compareDocumentPosition(b) & 4 ? -1 : 1;
			});
			if ( hasDuplicate ) {
				while(elem = node[++i]){
					if(elem == node[i-1]){
						node.splice(i--,1);
					}
				}
			}
			return node;
		},
		length:0
	};
	//扩充对象 简单扩展
	Jot.extend = function(target,source){
	 	var argus = Jot.fn.PUSH([], arguments),
			i = 1,
			force = typeof argus[argus.length - 1] == 'boolean' ? argus.pop() : true;

        argus.length == 1 && (target = Jot) && (i = 0);
		
        while (source = argus[i++]) {
            for (var p in source) {
                if (source.hasOwnProperty(p) && (force || ! (p in target))) {
                    target[p] = source[p];
                }
            }
        }
        return target;
	};
	//扩展Jot
	Jot.extend({
		//辅助判断属性
		assert: function(fn,no){
			var div = document.createElement('div'),
			    body= document.body;
			if ( !no ) {
				div.style.position='absolute';
				div.style.left='-1000px';
				body.appendChild(div);
			}
			
			fn(div);
			!no && body.removeChild(div);
			div = null;
		},
		//遍历对象或者数组
		each: function(object,filter){
			var i=-1,e,p;
			//修正参数
			if ( typeof object == 'function'){
				filter = object;
				object = this;
			}
			if ( object.length ) {
				while(e=object[++i]){
					if(false === filter(i,e,this)){
						break;
					}
				}
			} else {//对象
				for(p in object){
					if( object.hasOwnProperty(p)
						&& false === filter(p,object[p],this)){
						break;
					}
				}
			}
			return this;
		},
		//map,注意这里只适用于数组
		map: function(target,filter){
			var retval = [],i=0,e,tm;
			
			if ( typeof target =='function' ){
				filter = target;
				target = this;
				var mk = true;
			}
			
			while ( e=target[i++] ) {
				if (tm = filter(e,target)){
					tm.length == undefined
						? retval.push(tm) : Jot.fn.PUSH(retval,tm);
				}
				if ( tm === false ) break;
			}
			return mk ? Jot(retval) : retval;
		}
	});
	Jot.fn.each = Jot.each;
	Jot.fn.map = Jot.map;
	
	//辅助检测支持情况
	Jot.assert(function(div,id,e){
	
		Jot.BUGGY = {};
		//检查class，id支持情况
		div.innerHTML =  '<a name="'+(id='buggy'+expando)+'" href="#" style="float:left" class="test e"/><div class="test"></div><JOT style="width:40px;">abc</JOT>';
		if ( (e = document.getElementById(id)) && e.length){
			Jot.BUGGY.fixid = true;
		}
		//检查attr
		if(div.firstChild.getAttribute('class')){
			Jot.BUGGY.fixattr = {
				tabindex: "tabIndex",
				readonly: "readOnly",
				"for": "htmlFor",
				"class": "className",
				maxlength: "maxLength",
				cellspacing: "cellSpacing",
				cellpadding: "cellPadding",
				rowspan: "rowSpan",
				colspan: "colSpan",
				usemap: "useMap",
				frameborder: "frameBorder",
				contenteditable: "contentEditable"
			};
		}
		//opera 9.6 不能匹配第二个样式名
		if(!document.getElementsByClassName || !div.getElementsByClassName('e').length ||
		//safafi 不能匹配动态修改的classname
				((div.lastChild.className = 'e') && div.getElementsByClassName('e').length == 1)){
			Jot.BUGGY.fixclass = true;
		}
		//修正不支持自定义标签的情况
		if(!(e=div.getElementsByTagName('JOT')) || !e[0].offsetWidth){
			Jot.BUGGY.fixcustom = true;
		}
		//修正cssfloat
		if ((e=div.getElementsByTagName('a')).length && !e[0].style.float){
			Jot.BUGGY.cssFloat = true;
		}
	},true);
	
	//获取数据信息
	Jot.extend({
		//获取数据
		data: function(){
			var data = {};
			return function(elem,key,val){
				if (elem && elem.nodeType){
					var guid = elem[expando] || ( elem[expando]=Jot.uuid() ),
						tpef = typeof key == 'object';
						cache= data[guid] || (data[guid]={}); 
					//获取/删除
					if( val === undefined && !tpef) {
						if ( key || key == undefined ) {
							return key ?  cache[key] || null :cache;
						}
						for(var p in cache){
							delete cache[p];
						}
					} else if ( val === null ) {
							return delete cache[key];
					}
					//设置
					if( tpef ){
						for(var p in key){
							key[p] == null 
								? (delete cache[p]) :(cache[p] = key[p]);
						}
					}else {
						return cache[key] = val;
					}
				}
			}
		}(),
		//获取样式
		css: function(){
			var opacity = /opacity/i,
				cache = {},
				dcn = function (name){
					return cache[name] || (cache[name]=new RegExp(";?" + name + "[-:s][^;]+", "ig"));
				},
				ecn = function (name){
					return name.replace(/\-(\w)/g,function(_,$1){
						return $1.toUpperCase();
					})
				};
			return function(elem,name,val){
				
				var cssFloat = Jot.BUGGY.cssFloat,filter;
				//设置样式
				if ( val !== undefined  || typeof name == 'object') {
					
					var cssText = elem.style.cssText,
						ct = name,del=[],i=0;
						val && ( name={} ) && ( name[ct]=val );
					
					for(var p in name){
						if ( (ct = name[p=p.replace(/([A-Z])/g,"-$1").toLowerCase()]) || ct == 0 ){
							cssText += cssFloat&& p== 'float'
								? 'filter:alpha(opacity='+ct*100+');'
								: p+':'+ct+';';
						} else {//删除样式的情况
							del.push(p);
						}
					}
					//删除样式
					if ( del.length ){
						while(ct=del[i++]){
							cssText = cssText.replace(dcn(ct),'');
						}
					}
					return cssText && (elem.style.cssText = cssText);//写样式
				}
				//当样式不存在内敛样式的时候
				//中线转换成驼峰
				if ( (name = (cssFloat?( name == 'float'?'styleFloat':'cssFloat'):name)) && 
						!(val = elem.style[name=ecn(name)] )) {
						
					val = elem.currentStyle 
						? elem.currentStyle[val] 
						: getComputedStyle(elem,null)[name];
				}
				//修正样式
				if (name == 'opacity') {
					if(cssFloat && ( filter = elem.currentStyle.filter)){
						if ( opacity.test(filter) ){
							return ((val=filter.match(/\d+/)[0]/100)==1 || val ==0 )
								? val.toFixed(0) : val.toFixed(1);
						}
					}
					return val === undefined ? 1 : val;
				}
				//修正auto
				//auto 值是有width，height，top，left，right，bottom等才有
				if ( val == 'auto' && val.indexOf('%')>-1 ) {
					switch( name ) {
						case 'witdh':
						case 'height':
							var rect = elem.getBoundingClientRect();
							val = (name =='width' ? rect.right - rect.left :ret.bottom - rect.top )+'px'; 
							break;
						default: //top,left,right,bottom
							val = '0px';//这里要对状态的修正
							break;
					}
				}
				return val;
			}
		}()
	});
	//扩展对象原型
	//DOM操作相关
	Jot.extend(Jot.fn,{
		//查找对象
		find: function(selector){
			return this.map(function(item,jot){
				return jot.FIND(selector,item);
			});
		},
		//肯定检索
		has: function(selector){
			return Jot(this.FIND(selector,this,true));
		},
		//否定检索
		not: function(selector){
			return selector = this.MATCH(selector),
				this.map(function(item,jot){
					var retval = false,i=0,e;
					while ( e = selector[i++] ) {
						if ( !jot.META(e,item,true) ) {
							retval = true;
						}
					}
					return retval?item:0;
			});
		},
		//辅助函数
		dir: function(selector,dir){
			return this.map(function(item,jot){
				var retval = [];
				while(item = item[dir]){
					if (item.nodeType ==1) {
						if ( selector ) {
							if( jot.FIND(selector,item,true).length ){
								retval.push( item );
							}
						} else {
							return item;
						}
					}
				}
				return retval;
			});
		},
		parent: function(selector){
			return this.dir(selector,'parentNode');
		},
		children: function(selector){
			return this.map(function(item,jot){
				var child = item.childNodes,
					retval=[] ,i=0,e;
				while(e=child[i++]){
					if(e.nodeType ==1){
						retval.push(e);
					}
				}
				return selector ? jot.FIND(selector,retval,true): retval;
			});
		},
		prev: function(selector){
			return this.dir(selector,'previousSibling');
		},
		next: function(selector){
			return this.dir(selector,'nextSibling')
		},
		append: function(selector){
			return selector = Jot(selector),
				this.each(function(_,item){
					selector.each(function(_,e){
						item.appendChild(e);
				});
			});
		},
		prepend: function(selector){
			return selector = Jot(selector),
				this.each(function(_,item){
					selector.each(function(_,e){
						item.firstChild ? 
							item.insertBefore(e,item.firstChild) : item.appendChild(e);
				});
			});
		},
		after: function(selector){
			return selector = Jot(selector),
				this.each(function(_,item){
					selector.each(function(_,e,p){
						var parent = item.parentNode;
						item == (p=item.parentNode).lastChild ? 
						p.appendChild(e):p.insertBefore(e,item.nextSibling) ;
				});
			});
		},
		before: function(selector){
			return selector=Jot(selector),
				this.each(function(_,item){
					selector.each(function(_,e){
						item.parentNode.insertBefore(e,item);
				});
			});
		}
	});
	//获取高度宽度
	Jot.each({
		Height:'height',
		Width:'width'
	},function(name,type){
		Jot.fn[ type ] = function(elem){
			//window
			if ( (elem=this[0]) == elem.window ) {
				return elem.document.documentElement['client'+name];
			}
			//document
			if ( elem.nodeType == 9 ) {
				var doc = elem.documentElement;
				
				return Math.max(
					elem.body[ "scroll" + name ], doc[ "scroll" + name ],
					elem.body[ "offset" + name ], doc[ "offset" + name ],
					doc[ "client" + name ]
				);
			}
			//other
			return parseInt(Jot.css(elem,type),10);
		}
	});
	//类型判断
	Jot.extend({
		//是否函数
		isFunction: function(object){
			
			return TOSTRING.call(object) === '[object Function]';
		},
		//是否布尔类型
		isBoolean: function(object){
			
			return TOSTRING.call(object) === '[object Boolean]';
		},
		isArray: function(object){},
		isString: function(object){},
		isObject: function(object){},
		isPlainObject: function(object){},
		isEmptyObject: function(){}
	});
	window.Jot = window.$ = Jot;
})(this)
