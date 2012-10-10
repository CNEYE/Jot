/*
 * 一个简单的延迟队列，Jot.Deferred
 * 一个简单的任务列表 
 * 作者:　蜗眼 <iceet@uoeye.com>
 * 
 */
 define('Jot.Deferred',function(){
	
var Deferred = function Deferred(){},
	//唯一标识
	expando  = 'Jot.Deferred'+Jot.uuid();
	
	Deferred.prototype = {
		//标识是否状态锁定
		locked: function(unlocked){
			//标记锁定
			this[expando] = unlocked 
				!== undefined ? unlocked : true ;
			
			return this;
		},
		//数据访问/回调接口
		access: function(type,callback,argus,ctype){
			var access, list, item, idx = 0;
			
			if ( Jot.isFunction(callback) ) {
			
				this[access=expando+type] || (this[access]=[]);
				this[access].push(callback);
				
			} else if ( Jot.isBoolean(callback) && 
					(list=this[access=expando+type]) && list.length ) {
				//执行列表
				if ( callback ) {
					if (type=='done' || type=='fail') {
					
						 this.access('always',true,argus,type);
					}
					while(item = list[idx++]) item(argus,ctype||type);
				}
				//删除列表
				delete this[access];
			}
			return this;
		},
		//获取 taskid 
		taskid: function(task){
			//如果是函数的情况
			if ( Jot.isFunction(task) ) {
				return task[expando] || (task[expando]=Jot.uuid());
			}
			//如果是Deferred对象的时候
			if ( task instanceof Deferred ) {
				return task[caller=expando+':taskid'] || (task[caller]=Jot.uuid());
			}
			//如果是string的时候，就
			return task;
		},
		/*
		resolve: function(){},//修改当前任务列表的状态为已完成
		reject: function(){},//这个方法与deferred.resolve()正好相反，
		*/
		//检查任务列表完成情况
		//触发done，fail回调函数
		detect: function(type,argus){
			
			var tasks = this[tasks=expando+':tasklist'] || (
				this[tasks]={}),relys;
			//在状态完成的时候调用回调函数
			if ( this[expando+':status'] === type ){
				return this.access(type,true,argus);
			}
			//当满足条件的时候调用
			if (relys=this[expando+':relys']){
				for(var p in relys){
					if ( tasks[p] =='fail') {
						return type ==='done' ? false : this.access('fail',true,argus);
					}
				}
				//执行done完成
				type === 'done' && this.access('done',true,argus);
			}
		},
		/*
		always: function(always){},//无论是done，fail，总是触发。
		done: function(done){},//当任务列表完成的时候回调。
		fail: function(fail){},//当任务列表失败的时候回调。
		*/
		//在参数对象上部署deferred接口。
		//当参数为空时 ，为返回一个新的deferred对象，该对象的状态无法修改。
		promise: function( promise ){
			//在传入对象上部署Deferred接口
			if ( Jot.isFunction(promise) ){
				Jot.each('done,fail,always,promise,when,then,reject,resolve'
					.split(','),function(_,name){
						promise.prototype[name] = Deferred.prototype[name];
				});
				return this;
			}
			//放回行的对象
			return (new Deferred).locked();
		},
		//为多个操作指定回调函数
		//relys依赖列表
		when: function(){
		
			var param = arguments,item,idx=0,taskid,
				//看看relys依赖列表存在不
				relys = this[expando+':relys'] || (this[expando+':relys']={});
			
			while(item = param[idx++]){
				if (taskid = this.taskid(item)){
					relys[taskid] = true;
				}
			}
		},
		//done,fail的合体，always
		then: function(done,fail,always){
		
			this.done(done);
			this.fail(fail);
			return this.always(always);
		}
	};
	//扩充Deferred对象原型
	Jot.each('done,fail,always'
			.split(','),function(_,method){
		Deferred.prototype[method] = function(callback){
			return this.access(method,callback);
		};
	});
	
	//扩充Deferred对象原型
	Jot.each({
		resolve: 'done',
		reject: 'fail'
	},function(method,name){
		Deferred.prototype[method] = function(task,argus){
			//判断是否锁定
			if ( !this[expando] ) {
				var taskid ,tasks;
				
				if ( argus === undefined ) {	
					Jot.isPlainObject(task) && (argus = [task,task=null][0]);
				}
				//当存在taskid的时候
				if (taskid = this.taskid(Jot.isBoolean(task)
						? arguments.callee.caller : task )) {
					//检测是否存在task列表
					tasks = this[tasks=expando+':tasklist'] || (this[tasks]={});
					//标记当前task为完成状态
					tasks[taskid] = 'done';
				//当不存在taskid就表示为标记完成所有任务
				} else {
					if (tasks = this[expando+':tasklist']){
						//标记所有任务列表为完成状态
						for(var p in tasks){
							tasks[p] = name;
						}
					}
					//标记当前Deferred状态为完成状态
					this[expando+':status'] =name;
				}
				//检测任务完成状态 执行回调函数
				this.detect(name,argus);
			}
			return this;
		}
	});
	
	//将deferred构造函数放到Deferred对象上
	Deferred.promise = Deferred.prototype.promise;
	
	return Deferred;
 });
