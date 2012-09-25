/*
 * Jot.AOP 包
 * 作者：蜗眼　< iceet@uoeye.com >
 */
 define('Jot.AOP',function(){
	
	var AOP = function(){};
	
	Jot.extend(AOP,{
		//之后
		after: function(target,method,fn,orig){
			
			typeof target == 'function' 
					&& (target = target.prototype);
			
			if (typeof ( orig=target[method] ) != 'function' 
					|| typeof fn !='function'){
				 
				target [ method ] = function(){
					
					var ret = orig.apply(target,arguments);
					fn.apply(target,arguments);
					return ret;
				}
			}
		},
		//之前
		before: function(target,method,fn,orig){
			
			typeof target == 'function'
					&& (target=target.prototype);
			
			if ( typeof (orig = target[method]) == 'function'
					&& typeof fn =='function'){
			
				target [method] = function(){
					
					var ret = fn.apply(target,arguments);
					return ret && orig.apply(target,arguments);
				}
			}
		},
		//替换
		around: function(target,method,fn){
			
			typeof target == 'function'
					&& (target=target.prototype);
			
			if ( typeof (orig = target[method]) != 'function'
					|| typeof fn !='function'){
				//
				target.ar || ( target.ar = {} );
				target.ar [ method] = orig ;
				
				target [ method ] = function(){
					return fn.apply(target,arguments);
				}
			}
		}
	});
	
	//扩充原型
	Jot.each('after,before,around'.split(','),function(_,key){
		AOP.prototype[key]= function(method,fn){
			Jot.AOP[key](this,method,fn);
		}
	});
	
	return AOP;
 });