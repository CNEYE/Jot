/*
 * 一个延迟队列，Jot.Deferred
 * 一个任务列表 
 * 作者:　蜗眼 <iceet@uoeye.com>
 * 
 */
 define('Jot.Deferred',function(){
	
	var Deferred = function(){};
	
	//实现接口,done,fail,then() 
	//.resolve() reject() 
	//always()
	Deferred.prototype ={
		//当任务列表完成的时候回调
		done: function(){},
		//当任务列表失败的时候回调
		fail: function(){},
		//修改当前任务列表的状态为已完成
		resolve: function(){},
		//这个方法与deferred.resolve()正好相反，调用后将deferred对象的运行状态变为"已失败"，从而立即触发fail()方法。
		reject: function(){},
		//这个方法也是用来指定回调函数的，它的作用是，不管调用的是deferred.resolve()还是deferred.reject()，最后总是执行。
		always: function(){},
		//在参数对象上部署deferred接口。
		promise: function(){},
		//为多个操作指定回调函数
		when: function(){},
		//done,fail的合体
		then: function(){}
	};
	return Deferred;
 });