/*
 * 一种异步事件处理机制 Jot.Emiiter
 * 作者：蜗眼<iceet@uoeye.com>
 */
 define('Jot.Emitter',function(){
	
	var Emitter = function(){},
	    expando = 'emitter'+ZDK.uuid();
	
	Emitter.prototype = {
		//注册事件
		addListener: function(event,handler,data,once){
			
			this['@emitter'] || ( this['@emitter'] = {});
			this['@emitter'][event] || (this['@emitter'][event]=[]);
			
			if (typeof handler == 'function') {
				this['@emitter'][event].push({
					handler: handler,
					fhid: handler[expando] || (handler[expando]=ZDK.uuid()),
					data: data || {},
					once: once
				});
			}
			return this;
		},
		on: function(event,handler,data){
			return this.addListener(event,handler,data);
		},
		once: function(event,handler,data){
			return this.addListener(event,handler,data,true);
		},
		//注意这里的可以删除所有的事件，也可以删除指定的事件，更可以删除全部事件
		removeListener: function(event,handler,evt){
			
			this['@emitter'] || ( this['@emitter'] = {});
			//删除指定hanler
			if ( event !== undefined ) {
				if( evt = this['@emitter'][event] ) {
					if ( handler == undefined ) {
						return this['@emitter'][event] = [];
					}
					for(var len = evt.length-1;len>=0;len--){
						if ( evt[len].fhid == handler[expando]){
							evt.splice(len,1);
						}
					}
				}
			//删除全部事件
			} else {
			
				for (var p in this['@memitter']){
					this.removeListener(p);
				}
			} 
		},
		//触发
		trigger: function(event,data){
			
			var retvalue , evt ,item;
				this['@emitter'] || ( this['@emitter'] = {});
			
			if ( evt = this['@emitter'][event] ) {
				for(var len = evt.length-1,len>=0;len--) {
					retvalue = (item = evt[len]).handler(Jot.extend({},item.data,data||{}));
					//只触发一次
					if ( item.once ) {
						evt.splice( len,1 );
					}
				}
			}
			return retvalue;
		}
	};
	
	return Emitter;
 });