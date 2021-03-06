(function(window){
/*
 * 简单选择器
 * 支持 
 	1、id选择器 （#id）
 	2、class选择器 (.class)
 	3、tag选择器材 (tag)
 	4、属性选择器 ([attr=val])
 	5、后代选择器 (#id > .class)
 	6、子孙选择器 (#id .class)
 	7、分组选择器 (#id , .class)
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
	rcompose  = /\s*([>,\s])\s*/g,//组合，支持 >,\s
	rselector = /([\.#]*)(\w*)(?:\[(\w+)=(\w+)\])?/ig,
	
	rhtml     = /(?:<[^>\/]*\/>)|(?:<[^>]*>.*<\/.*>)/g,
	rhtmlTag  = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
	rnotag    = /(^[^<]*|[^>]*$)/g,
	roften	  = /<\/(\w+)\s*>/g,
	//这里判断boolean属性
	rboolean = /^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,
	
	push = Array.prototype.push;
	
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
		ATTR: function(elem,name,val,isbool){
			if ( Jot.BUGGY.fixattr ){
				name = Jot.BUGGY.fixattr[name] || name;
				if(val === undefined && 'href,src,'.indexOf(name+',')>-1){
					return elem.getAttribute(name,2);
				}
			}
			
			isbool = isbool || rboolean.test(name);
			//获取
			if ( val === undefined) {
				val = elem.getAttribute(name);
				return isbool ? !! val : val;
			}
			//设置
			return elem.setAttribute(name,isbool ? !!val : val);
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
				push.apply(target,source);
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
	//简单事件模型
	//这里实现事件的简单处理
	window.Jot = window.$ = Jot;
})(this)
