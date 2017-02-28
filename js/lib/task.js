;(function(){
  var Task = function(){
    this.PAUSE = 1;
    this.STOP = 1;
  };
  /**
   * 开始执行
   * @return {[type]} [description]
   */
  Task.prototype.start = function (){
    this.STOP = 0;
    this.PAUSE = 0;
    return this._run(0);
  };
  /**
   * 指定第一个任务
   * @param  {Function} fn [待执行的任务代码，type=ture时fn应带参数next，
   *                          并在代码中回调next，使继续后面的任务
   *                          type=false时，fn应返回拟执行时间(ms)作为下一个任务的延迟执行时间]
   * @param  {[type]}   type [type为true时为同步任务，false为伪同步任务]
   * @return {[type]}        [description]
   */
  Task.prototype.first = function (fn, type) {
    this.queue = [];
    this.index = 0;
    return this._add(fn, type);
  };
  /**
   * 指定下一个任务
   * @param  {Function} fn [同 first]
   * @param  {[type]}      [同 first]
   */
  Task.prototype.then = function (fn, type) {
    return this._add(fn, type);
  };
  /**
   * 当前任务执行完后暂停一定时间后继续执行
   * @param  {[type]} time [睡眠时间(ms)]
   * @return {[type]}      [description]
   */
  Task.prototype.sleep = function(time){
    return this._add(function(){
      return time;
    });
  };
  /**
   * 当前任务执行完后进入等待
   * @return {[type]} [description]
   */
  Task.prototype.wait = function () {
    this.PAUSE = 1;
    return this;
  };
  /**
   * 暂停后的继续执行
   * @return {[type]} [description]
   */
  Task.prototype.notify = function(){
    if(this.PAUSE === 1){
      this.PAUSE = 0;
      return this._run(this.index);
    }
    return this;
  };
  /**
   * 当前任务执行完后停止执行，任务指针指向第一个任务
   * @return {[type]} [description]
   */
  Task.prototype.stop = function () {
    this.index = 0;
    this.STOP = 1;
    return this;
  };
  /**
   * 在传入函数fn内调用，使任务指针偏移
   * @param  {[type]} vary [description]
   * @return {[type]}      [description]
   */
  Task.prototype.jump = function(vary){
    this.index = this.index + vary;
  };
  /**
   * 执行下一个任务
   * @return {[type]} [description]
   */
  Task.prototype._next = function () {
    return this._run(++this.index);
  };
  /**
   * 向任务队列添加一个任务
   * @param {Function} fn   [description]
   * @param {[type]}   type [description]
   */
  Task.prototype._add = function(fn, type){
    this.queue.push({
      fn: fn,
      type: type
    });
    return this;
  };
  /**
   * 执行任务
   * @param  {[type]} index [description]
   * @return {[type]}       [description]
   */
  Task.prototype._run = function(index){
    if(this.PAUSE) return this;
    if(this.STOP) return this;
    if(index >= this.queue.length) return this._finish();
    var task = this.queue[index];
    var type = task.type;
    var self = this;
    if(type){
      //执行伪同步任务时，伪同步任务应返回该任务拟执行时间delay
      //作为执行下一个任务的延时
      var delay = task.fn.call(this);
      if(isNaN(delay)){//没有返回延时值(ms), 不再继续执行
        this.wait();
      }else {
        setTimeout(function(){
          self._next();
        }, delay);
      }
    }else { //执行同步任务，任务中回调next进入下一个任务
      var next = function(){
        self._next();
      };
      task.fn.call(this, next);
    }
    return this;
  };
  /**
   * 所有任务执行完成
   * @return {[type]} [description]
   */
  Task.prototype._finish = function(){
    this.queue = [];
    this.index = 0;
  };
  window.Task = Task;
})();
