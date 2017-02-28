/**
 * CSS3动画
 * @type {[type]}
 */
;(function(){
  var AnimateWin = function(obj){
    //参数传入方法时阻止已实现方法向上传递
    var bf = function(cb){
      return cb();
    };
    this.anWinPreClose = obj.preClose|| this.anWinPreClose ||bf;
    this.anWinOnDrag = obj.onDrag|| this.anWinOnDrag ||bf;
    this.anWinPreMaximize = obj.preMaximize|| this.anWinPreMaximize ||bf;
    this.anWinPreReMaximize = obj.preReMaximize|| this.anWinPreReMaximize ||bf;
    this.anWinPreMinimize = obj.preMinimize|| this.anWinPreMinimize ||bf;
    this.preReMinimize = obj.preReMinimize|| this.preReMinimize ||bf;
    this.postReMinimize = obj.postReMinimize|| this.postReMinimize ||bf;
    obj.onMinimize = null;
    obj.onMaximize = null;
    obj.onDrag = null;
    obj.preClose = null;

    if(obj.className)
      this.className = "window-animate "+obj.className;
    else
      this.className = "window-animate";
    Win.call(this, obj);
    this._init_AnimateWin();
  };
  if(!Object.create){
    Object.create = function(proto){
      function F(){}
      F.prototype = proto;
      return new F();
    };
  }
  AnimateWin.prototype = Object.create(Win.prototype);
  /**
   * 初始化
   * @return {[type]} [description]
   */
  AnimateWin.prototype._init_AnimateWin = function(){
    var style = document.createElement("style");
    style.id = this.id+"_style_animation";
    this.win.appendChild(style);
    this._style_node_reset(style);
  };
  AnimateWin.prototype._style_node_reset = function(style){
    var style = style || this.$(this.id+"_style_animation");
    style.innerHTML = "";
    this.addCssClass("close", style);
    this.addCssClass("maximize", style);
    this.addCssClass("re-maximize", style);
    this.addCssClass("minimize", style);
    this.addCssClass("re-minimize-prior", style);
    this.addCssClass("re-minimize", style);
  };
  /**
   * 拖动时接触浏览器左上边缘时，窗口后面显示一个罩层表示将要最大化的位置
   * @param  {[type]}   e    父类拖动事件mousemove传入的事件对象
   * @param  {[type]}   left 窗口left属性
   * @param  {[type]}   top  窗口top属性
   * @param  {Function} next 执行next回调执行父类drag函数
   * @return {[type]}        [description]
   */
  AnimateWin.prototype.onDrag = function(e, left, top, next){
    var task = new Task();
    var self = this;
    task.first(function(_next){
      self.anWinOnDrag(_next);
    }).then(function(){
      self._onDrag(e, left, top);
    }).start();
    return next();
  };
  AnimateWin.prototype._onDrag = function(e, left, top){
    e.pageX = e.pageX || e.clientX+document.body.scrollLeft;
    e.pageY = e.pageY || e.clientY+document.body.scrollTop;
    if((top<=-10||e.pageX<=5)&&!document.getElementById("window_maximize_cover")){//显示
      var cover = document.createElement("div");
      var b = document.body;
      var css = ".window-animate-appendix.maximize-cover-box{"+
        "z-index:"+(window[this.group].global.z_index-1)+
        ";left:"+e.pageX+"px"+
        ";top:"+e.pageY+"px"+
      ";}";
      cover.innerHTML = '<style id="maximize_cover_style">'+ css +'</style>'+
        '<div class="window-animate-appendix maximize-cover"><div class="cover-inner"></div></div>';
      cover.id = "window_maximize_cover";
      cover.className = "window-animate-appendix maximize-cover-box";
      b.appendChild(cover);
      this.COVERING = true;
      var self = this;
      if(top<=-10&&e.pageX<=5){
        setTimeout(function(){
          self.addClass(cover, "show quarter-left-top");
        }, 0);
      }else if(top<=-10){
        setTimeout(function(){
          self.addClass(cover, "show full");
        }, 0);
      }else if(e.pageX<=5){
        setTimeout(function(){
          self.addClass(cover, "show half-left");
        }, 0);
      }
      var mup =function(){
        var _cover = document.getElementById("window_maximize_cover");
        var callee = arguments.callee;
        if(_cover){
          if(e.pageX<15)  self._halfWidthMax(_cover);
          _cover.parentNode.removeChild(_cover);
          delete self.COVERING;
        }
        self.removeEvent(document, "mouseup", callee);
      };
      this.addEvent(document, "mouseup", mup);//鼠标抬起删除罩层
    }else if (this.COVERING) {//鼠标离开删除罩层
      if(e.pageX>15&&top>-10){
        var _cover = document.getElementById("window_maximize_cover");
        _cover.parentNode.removeChild(_cover);
        delete this.COVERING;
      }else {//改变罩层
        var self = this;
        var cover = document.getElementById("window_maximize_cover");
        if(top<=-10&&e.pageX<=5){
          setTimeout(function(){
            self.addClass(cover, "quarter-left-top");
            self.removeClass(cover, "full");
            self.removeClass(cover, "half-left");
          }, 0);
        }else if(top<=-10){
          setTimeout(function(){
            self.addClass(cover, "full");
            self.removeClass(cover, "quarter-left-top");
            self.removeClass(cover, "half-left");
          }, 0);
        }else if(e.pageX<=5){
          setTimeout(function(){
            self.addClass(cover, "half-left");
            self.removeClass(cover, "quarter-left-top");
            self.removeClass(cover, "full");
          }, 0);
        }
      }
    }
    this.onDrag2 && this.onDrag2(e);
  };
  /**
   * 拖动到视口左侧或左上角窗口适应视口扩大
   * @param  {[type]} cover 罩层节点
   * @return {[type]}       [description]
   */
  AnimateWin.prototype._halfWidthMax = function(cover){
    var b = document.body;
    if(this.hasClass(cover, "quarter-left-top")){//四分一
      this.setCss({
        height: b.clientHeight/2+"px",
        width: b.clientWidth/2+"px",
        top: b.scrollTop+"px",
        left: b.scrollLeft+"px"
      });
    }else if(this.hasClass(cover, "half-left")){//半
      this.setCss({
        height: b.clientHeight+"px",
        width: b.clientWidth/2+"px",
        top: b.scrollTop+"px",
        left: b.scrollLeft+"px"
      });
    }
    if(this.top<0) this.top = 0;
    if(this.top>b.clientHeight-45) this.top = b.clientHeight - 45;
    this.onDrag2 = this._resetSize;
  };
  /**
   * 窗口适应性扩大后再拖动恢复原来大小
   * @param {[type]} e [description]
   */
  AnimateWin.prototype._resetSize = function(e){
    this.setCss({
      height: this.height +"px",
      width: this.width +"px",
      top: document.body.scrollTop +"px"
    });
    this.onDrag2 = null;
  };
  /**
   * 关闭前执行动画
   * @param  {[type]} e [description]
   * @return {[type]}   false阻止执行关闭
   */
  AnimateWin.prototype.preClose = function(cb){
    var task = new Task();
    var self = this;
    task.first(function(next){
      self.anWinPreClose(next);
    }).then(function(next){
      var lasting = 150;
      var css = self.crossBrowser("transition-duration:"+ lasting/1000 +"s").join(";");
      self.removeClass(self.win, "maximize");
      self.addClass(self.win, "close");
      self.addCssToClass("close", css);

      setTimeout(function(){
        self._style_node_reset();
        cb();
      }, lasting);
    }).start();
  };
  /**
   * 最大化前的动画
   * @return {[type]} [description]
   */
  AnimateWin.prototype.preMaximize = function(next){
    var task = new Task();
    var self = this;
    task
      .first(function(_next){
        self.anWinPreMaximize(_next);
      })
      .then(function(){
        var win = self.win;
        var lasting = 200;
        self.addClass(win, "maximize-prior");
        self.setCss({
          width:"100%", height:"100%",
          top: 0, left: 0
        });
        setTimeout(function(){
          var css = self.crossBrowser("transition-duration:"+ lasting/1000 +"s").join(";");
          self.addCssToClass("maximize", css);
          self.addClass(win, "maximize");
          self.removeClass(win, "maximize-prior");
        }, 0);
        setTimeout(function(){
          self.removeClass(win, "maximize");
          self._style_node_reset();
          next();
        }, lasting);
      }).start();
  };
  /**
   * 还原前的动画
   * @param  {Function} next 回调next继续执行父类函数
   * @return {[type]}        [description]
   */
  AnimateWin.prototype.preReMaximize = function(next){
    var task = new Task();
    var self = this;
    task.first(function(_next){
      self.anWinPreReMaximize(_next);
    }).then(function(_next){
      var win = self.win;
      var lasting = 150;
      var css = self.crossBrowser("transition-duration:"+ lasting/1000 +"s").join(";");
      self.removeClass(win, "maximize");
      self.addCssToClass("re-maximize", css);
      self.addClass(win, "re-maximize-prior");
      self.setCss({
        height: self.height+"px",
        width: self.width+"px",
        top: self.top+"px",
        left: self.left+"px",
      });
      setTimeout(function(){
        self.addClass(win, "re-maximize");
        self.removeClass(win, "re-maximize-prior");
      }, 1);
      setTimeout(function(){
        self.removeClass(win, "re-maximize");
        self._style_node_reset();
        next();
      }, lasting);
    }).start();
  };
  /**
   * 最小化前的动画
   * @param  {Function} next 回调next继续执行父类函数
   * @return {[type]}        [description]
   */
  AnimateWin.prototype.preMinimize = function(next){
    var task = new Task();
    var self = this;
    task.first(function(_next){
      self.anWinPreMinimize(_next);
    }).then(function(){
      var win = self.win;
      var b = document.body;
      var lasting = 200;
      var scale = 0.7;
      var aim_top = b.clientHeight -self.height*0.75;
      var aim_left = b.clientWidth/5 -self.width*0.25;
      var duration = self.crossBrowser("transition-duration:"+ lasting/1000 +"s").join(";");
      var animation = "";//self.crossBrowser("animation:minimize "+ lasting/1000 +"s forwards linear").join(";");
      var btn = self.$(self.id+"_maximize");
      if(btn&&self.hasClass(btn, "max")){
        self.addCssClass("tempclass", null, true);
        self.addCssToClass("tempclass", "transform:scale(0.8)");
        self.addClass(self.win, "tempclass");
        aim_top = self.height/2-50;
      }
      var css = duration +";"+ animation + ";top:"+
        aim_top+"px;left:"+
        aim_left+"px;opacity:0;transform:scale(0.5);";
      self.addCssToClass("minimize", css);
      setTimeout(function() {
        self.addClass(win, "minimize");
        self.setCss({
          top: "none",
          left: "none"
        });
      }, 0);
      setTimeout(function(){
        self.hide();
        var btn = self.$(self.id+"_maximize");
        if(btn&&self.hasClass(btn, "max")){
          self.setCss({
            top: 0,
            left: 0
          });
        }else{
          self.setCss({
            top: self.top+"px",
            left: self.left+"px"
          });
        }
        self.removeClass(win, "minimize");
        self._style_node_reset();
        next();
      }, lasting);
    }).start();
  };
  /**
   * 最小化
   * @return {[type]} [description]
   */
  AnimateWin.prototype.minimize = function(){
    var task = new Task();
    var self = this;
    task.first(function(next){
      self.preMinimize(next);
    }).then(function(next){
      console.log("implement minimize");
      next();
    }).then(function(){
      self.postMinimize();
    }).start();
  };
  /**
   * 最小化前的动画
   * @return {[type]} [description]
   */
  AnimateWin.prototype.reMinimize = function(){
    var task = new Task();
    var self = this;
    task.first(function(next){
      self.preReMinimize(next);
    }).then(function(next){
      self.pushToFront();
      var btn = self.$(self.id+"_maximize");
      var win = self.win;
      var b = document.body;
      var bw = b.clientWidth;
      var bh = b.clientHeight;
      var fromLeft = bw*0.1;
      var fromBottom = 0;
      var lasting = 200;
      var height = self.height;
      var width = self.width;
      var left = self.left;
      var top = self.top;
      var y = bh -height -top -fromBottom;
      var x = left -fromLeft;
      var _x = Math.pow(2, -0.004*Math.abs(x)) *x;
      var _y = Math.pow(2, -0.004*Math.abs(y)) *y;
      if(btn&&self.hasClass(btn, "max")){
        height = bh;
        width = bw;
        left = 0;
        top = 0;
        _x = -bw*0.08;
        _y = 20;
      }
      var css = "height:"+ height*0.85 + "px;width:" + width*0.85 +
        "px;left:" + (left-_x) + "px;top:" + (top+_y+height*0.15) + "px;opacity:0;transform: scale(0.85);";
      self.addCssToClass("re-minimize-prior", css);
      self.addClass(self.win, "re-minimize-prior");
      self.show();
      var duration = self.crossBrowser("transition-duration:"+ lasting/1000 +"s").join(";");
      css = "height:"+ height + "px;width:" + width +
        "px;left:" + left + "px;top:" + top + "px;opacity:1;transform: scale(1);"+duration;
      self.addCssToClass("re-minimize", css);
      setTimeout(function(){
        self.addClass(win, "re-minimize");
      }, 0);
      setTimeout(function(){
        self.removeClass(win, "re-minimize-prior");
        self.removeClass(win, "re-minimize");
        self._style_node_reset();
      }, lasting);
    }).then(function(){
      self.postReMinimize();
    }).start();
  };
  /**
   * 最小化后，当前窗口对象移到数组最前位置
   * @return {[type]} [description]
   */
  AnimateWin.prototype.postMinimize = function(){
    this.pushToHead();
  };
  /**
   * 向标签添加一个css类
   * @param {[type]} cls   [description]
   * @param {[type]} style [description]
   * @param {[type]} style [true在最前面加]
   */
  AnimateWin.prototype.addCssClass = function(cls, style, front){
    var style = style||document.getElementById(this.id+"_style_animation");
    if(front){
      style.innerHTML = "#"+this.id+".window-animate."+ cls+"{}" + style.innerHTML;
    }else {
      style.innerHTML += "#"+this.id+".window-animate."+ cls+"{}";
    }
    return this;
  };
  /**
   * 修改或重写类名对应的css样式
   * @param {[type]} cls 类名
   * @param {[type]} obj 修改的样式，样式名'-'换为'_'传入
   * @param {[type]} style 目标标签
   */
  AnimateWin.prototype.setCssToClass = function(cls, obj, style){
    var style = style||document.getElementById(this.id+"_style_animation");
    if(arguments.length===1){
      style.innerHTML = arguments[0];
    } else {
      var css = style.innerHTML;
      for(var key in obj){
        regs = "(\\."+ cls +"((\\s+|[#\\.\\{:>])[^\\{]*\\{|\\s*\\{)[^\\}]*"+ key.replace("_","-") +"\\s*:\\s*)[^;]*([;\\}]{1,2})";
        css = css.replace(new RegExp(regs), "$1"+obj[key]+"$4");
      }
      style.innerHTML = css;
    }
    return this;
  };
  /**
   * 向已有的class中加属性
   * @param {[type]} cls   类名
   * @param {[type]} str   属性字符串
   * @param {[type]} style 目标标签
   */
  AnimateWin.prototype.addCssToClass = function(cls, str, style){
    var style = style||this.$(this.id+"_style_animation"),
      css = style.innerHTML,
      regs = "(\\."+ cls +"(([#\\.:>\\s+][^\\{]*\\{)|\\{)[^\\{]*)\\}";
    style.innerHTML = css.replace(new RegExp(regs), "$1;"+str+";}");
  };
  /**
   * 增加浏览器兼容前缀
   * @param  {[type]}     输入多个属性
   * @return {[type]}     返回数组
   */
  AnimateWin.prototype.crossBrowser = function(){
    var arg = arguments, i = 0, arr=[], s;
    for(;i<arg.length;i++){
      s = arg[i];
      arr.push("-webkit-"+s, "-moz-"+s, "-ms-"+s, "-o-"+s, s);
    }
    return arr;
  };
  window.AnimateWin = AnimateWin;
})();
