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
	rcompose  = /\s*([>,\s])\s*/g,//组合，支持 >,\s
	rselector = /([\.#]*)(\w*)(?:\[(\w+)=(\w+)\])?/ig,
	
	rhtml     = /(?:<[^>\/]*\/>)|(?:<[^>]*>.*<\/.*>)/g,
	rhtmlTag  = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
	rnotag    = /(^[^<]*|[^>]*$)/g,
	roften	  = /<\/(\w+)\s*>/g,
	rroot	  = /^(?:html|body)/i,
	rinlineJot= /Jot(\.[a-z]+)?\d+/ig,
	//这里判断boolean属性
	rboolean = /^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,
	
	
	tostring = Object.prototype.toString,
	hasOwnProperty = Object.prototype.hasOwnProperty,
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
	
	//扩充对象 简单扩展
	Jot.extend = function(target,source){
	 	var argus = Jot.fn.PUSH([], arguments),
			i = 1,
			force = typeof argus[argus.length - 1] == 'boolean' ? argus.pop() : true;

        argus.length == 1 && (target = this) && (i = 0);
		
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
			if ( object.length !== undefined ) {
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
		},
		//简单属性访问，主要是处理，设置和获取的处理问题
		access: function(access,fn,value,key){
			
			var iget = !((key == undefined) ? 
					typeof value === 'object' :  value !== undefined),
				e,i=0,ret;

			if ( access[0] ){
				while(e=access[i++]){
					ret =fn(e,iget);
					if(isset){
						return ret;
					}
				}
			}
			return this;
		}
	});
	
	Jot.fn.each = Jot.each;
	Jot.fn.map = Jot.map;
	Jot.fn.access = Jot.access;

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
	
	//DOM附带数据操作
	//以及样式操作
	Jot.extend({
		//储存数据到DOM元素上,获取、删除等
		data: function(){
		
			var data = {};
			return function ( elem,key,val ) {
				
				var id,isobject,cache;
				//这里不对 elem 的正确类型做判断
				if ( elem && (elem).nodeType ) {
					cache = data[ id 
						  = ( elem[expando]||(elem[expando]=Jot.uuid()) )];
					
					if ( Jot.isPlainObject(key) ) {
						for ( var p in key ) {
							key[p] === null 
								? (delete cache[p]) : (cache[p]=key[p]);
						}
						
					} else {
						if ( (val === undefined || val === null)
							&& !(isobject = Jot.isPlainObject(key)) ) {
							
							if ( val === null ) {
								return delete cache[key];
								
							} else {
								//获取
								if (key || key === undefined){
									return key ? cache[key] || null : cache
								}
								//删除该elem的所有数据,这里不做遍历处理
								return delete data[id];
							}
						}
						return cache[key] = val;
					}
				//清空数据储存,无论传入的是true/false都执行删除语句
				} else if ( Jot.isBoolean(elem) ){
				
					for ( var p in data ) {
						if (data.hasOwnProperty(p)){
							delete data[p];
						}
					}
				}
			}
		}(),
		//注意这里对样式的操作
		//包括设置和获取
		css: function(){
			
			var ropacity = /opacity/i,
				cache = {},
				wheight = {width:1,height:1},
				regcace = function(name){
					return cache[name] || (cache[name] = new RegExp(':?'+name+'[-:s][^;]+','ig'));
				},
				camelize = function(name){
					return name.replace(/\-(\w)/g,function(_,$1){
						return $1.toUpperCase();
					});
				};
			
			return function(elem,key,val){
				
				var cssFloat = Jot.BUGGY.cssFloat,filter;
				//设置/删除 样式
				if ( undefined !== val || Jot.isPlainObject(key) ) {
					
					var cssText = elem.style.cssText+'',
						delarr = [],ckey = key,i=0;
						val && ( key ={} ) && ( key[ckey] = val );
						
					for (var k in key ) {
						if ( (ckey = key[k=k.replace(/([A-Z])/g,"-$1").toLowerCase()]) 
								|| ckey !== null){
						
							cssText += cssFloat && opacity.test( k )
									? 'filter:alpha(opacity='+ckey*100+');' 
									: k+':'+ckey+';';
						//这里是删除的情况 赋值为null的时候表示删除
						} else {
							delarr.push(k);
						}
					}
					//如果存在删除的数组的时候删除
					//但是这里不对其他地方的样式进行删除，
					//仅对内敛样式进行操作
					if ( delarr.length ) {
						while (ckey = delarr[i++]){
							cssText.replace(regcace[ckey],'');
						}
					}
					return cssText  && (elem.style.cssText=';'+cssText);
				}
				
				//以下部分为获取样式
				//这里只修正了float和opacity属性
				if ((key= (key==='float' ? (cssFloat 
						? "styleFloat":"cssFloat") : key)) 
						&& !(val = elem.style[key = camelize(key)])){
					
					val = elem.currentStyle
						? elem.currentStyle[key]
						: getComputedStyle(elem,null)[key];
				}
				//修正透明度问题
				if ( key == 'opacity' ){
					if (cssFloat && (filter = elem.currentStyle.filter)){
						if(opacity.test(filter)){
							return ((val=filter.match(/\d+/)[0]/100)===1 || val === 0) 
								? val.toFixed(0) : val.toFixed(1);
						}
					}
					return undefined === val ? 1: val;
				}
				//修正宽度，高度的auto和%情况
				//这里不对padding，border等影响做排除
				if ( val.toLowerCase() === 'auto' || val.indexOf('%')>-1){
					if (key in wheight){
						//注意这里没有判断不支持getBoundingClientRect函数的情况
						var rect = elem.getBoundingClientRect();
						return key === 'width' ? rect.right-rect.left : rect.bottom - rect.top;
					}
				}
				return val;
			}
		}()
	});
	
	//扩展对象原型
	//DOM操作相关
	Jot.fn.extend({
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
		},
		remove: function(clear){
			return this.each(function(_,item){
				//清空数据
				clear && Jot.clean(item,null);
				
				item.parnetNode.removeChild(item);
			})
		}
	});
	
	//扩充简单的位置函数
	Jot.fn.extend({
		//获取相对于文档的left，top属性
		offset: function(){
			
			var rect , docElem , win, 
				elem = this[0],
				doc = elem && elem.ownerDocument,
				body = doc.body;
			
			if ( !doc ){
				return;
			}
			
			docElem = doc.documentElement;
			//这里忽略一些不支持getBoundingClientRect函数的浏览器
			rect = elem.getBoundingClientRect();
			win = getWindow( elem );
			
			return {
				top:rect.top+ ( win.pageYOffset || docElem.scrollTop )
							- ( docElem.clientTop || body.clientTop || 0 ),
				left:rect.left + (win.pageXOffset || docElem.scrollLeft)
							   - (docElem.clientLeft || body.clientLeft ||0)
			}
		},
		//获取简单的position
		position: function(){
			
			if ( !this[0] ) {
				return ;
			}
			
			var elem = this[0],
				offsetParent = this.offsetParent(),
				
				offset = this.offset(),
				parentOffset = rroot.test(offsetParent[0].nodeName) 
						? {left:0,top:0} : offsetParent.offset();

			//这里不对border，margin的印象做管理
			return {
				top: offset.top - parentOffset.top,
				left: offset.left - parentOffset.left
			}
		},
		//获取相对于上一次定位过的元素的left，top
		offsetParent: function(){
			return this.map(function(item,jot){
					
				var offsetParent = item.offsetParent || document.body;
				
				while(offsetParent && 
					!rroot.test(offsetParent.nodeName)){
					
					offsetParent = offsetParent.offsetParent;
				}
				return offsetParent || document.body;
			});
		}
		
	});
	
	function getWindow(elem){
		return elem.window === elem ? 
				elem :
				elem.nodeType === 9 ?
					elem.defaultView || elem.parentWindow : false;
	}
	
	//这里设置scrollLeft，scrollTop方法
	Jot.each({
		scrollLeft: 'pageXOffset',
		scrollTop: 'pageYOffset'
	},function ( method,prop ){
		var itop = prop === 'pageYOffset';
		
		Jot.fn[ method ] = function( val ,k){
			
			return this.access(this,function(elem,iget){
				
				var win = getWindow(elem),doc,
				//获取
				if (iget) {
					doc = win && win.document;
					return win ? win[prop] ||
						(doc.documentElement[method] ||doc.body[method]): elem[method];
				}
				
				//设置
				if ( win ) {
					win.scrollTO(
						!itop ? val : Jot(win).scrollLeft(),
						itop ? val : Jot(win).scrollTop()
					)
				} else {
					elem[method]=val;
				}
				
			},val);
		}
	});
	
	//获取高度宽度
	//简单版本，不包括padding，margin，border
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
	
	//这里主要是值的获取设置
	Jot.fn.extend({
		val: function(val){
		},
		html: function(val){
			var value = val && Jot.fn.UNKNOWN(
						val.replace(rxhtmlTag, "<$1></$2>"));
			
			return this.access(function(elem,iget){
				//获取
				if ( iget ){
					return elem.nodeType === 1 ?
						elem.innerHTML.replace( rinlineJot , '') : 
						undefined;
				}
				//设置
				try{
					//清理数据以及相关事件等
					Jot.clean(document.getElementsByTagName('*'));
					
					elem.innerHTML = value;
				}catch(e){}
				
			},val);
		},
		attr: function(name,val){
			var isBool = rboolean.test(name);
			
			return this.access(this,function(elem,iget){
				
				if ( iget ) {
					return Jot.ATTR(elem,name);
				}
				
				Jot.ATTR(elem,name,val,isBool);
			},name,val)
		},
		removeAttr: function(name){
			
			var isBool = rboolean.test(name),
				trueName =  (Jot.BUGGY.fixattr && Jot.BUGGY.fixattr[name]) || name;
			
			return this.access(this,function(elem){
						
				if ( isBool ) {
					return elem[trueName] = false;
				}
				elem.removeAttribute(trueName);
			},name,true);
			
		},
		data: function(name,value){},
		removeData: function(name){},
		css: function(name,value){},
		//class操作
		addClass: function(name){},
		hasClass: function(name){},
		removeClass: function(name){}
	});
	
	
	//类型判断
	//这里主要是判断
	Jot.extend({
		isPlainObject: function(object){
			
			if ( !object || Jot.isObject(object)
				|| object.nodeType || object.setInterval ) {
				return false;
			}
			if ( object.constructor 
				&& !hasOwnProperty.call(object,'constructor') 
				&& !hasOwnProperty.call(object.constructor.prototype,'isPrototypeOf')){
					return false;
			}
			var key ;
			for(var key in object){}
			
			return key === undefined || hasOwnProperty.call(object,key);
		},
		isEmptyObject: function(object){
			
			if (Jot.isPlainObject(object)){
				var key ;
				for(var key in object){}
				return key === undefined;
			}
			return false;
		}
	});
	//这里添加 isArray等函数
	Jot.each('Array,Boolean,Object,String,Function'
		.split(',')
	,function(_,name){
			Jot['is'+name] = function(object){
					return tostring.call(object) ==='[object '+name+']'
			}
	});
	
	
	//简单事件模型
	//这里实现事件的简单处理
	window.Jot = window.$ = Jot;
})(this)
