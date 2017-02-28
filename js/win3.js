;(function () {
  var Win = function (obj) {
    if (!(this instanceof Win)) throw new Error("Instance required");
    this.id = obj.id || this.id;
    this.width = obj.width || this.width || 400;
    this.height = obj.height || this.height || 300;
    this.top = obj.top || this.top || 50;
    this.left = obj.left || this.left || 50;
    this.color = obj.color || this.color || "#515c6b";
    this.className = obj.className || this.className || "";
    this.containerId = obj.containerId || "window_container";

    this.resizable = obj.resizable || this.resizable || true;
    this.title = obj.title || this.title;
    this.btnGroup = obj.btnGroup || this.btnGroup || [1, 1, 1];

    var bf = function () {
      return true;
    };
    this.group = obj.group || "wins";
    this.preOpen = obj.preOpen || this.preOpen || bf;
    this.postOpen = obj.postOpen || this.postOpen || bf;
    this.preClose = obj.preClose || this.preClose || bf;
    this.postClose = obj.postClose || this.postClose || bf;
    this.onMouseDown = obj.onMouseDown || this.onMouseDown || bf;
    this.onClick = obj.onClick || this.onClick || bf;
    this.onDrag = obj.onDrag || this.onDrag || bf; //(e, left, top)
    this.onDragMouseUp = obj.onDragMouseUp || this.onDragMouseUp || bf;
    this.onResize = obj.onResize || this.onResize || bf;
    this.preMaximize = obj.preMaximize || this.preMaximize || bf;
    this.postMaximize = obj.postMaximize || this.postMaximize || bf;
    this.preReMaximize = obj.preReMaximize || this.preReMaximize || bf;
    this.postReMaximize = obj.postReMaximize || this.postReMaximize || bf;
    this.preMinimize = obj.preMinimize || this.preMinimize || bf;
    this.postMinimize = obj.postMinimize || this.postMinimize || bf;

    this._init_Win();
  };
  Win.prototype = {
    /**
     * 初始化
     * @return {[type]} [description]
     */
    _init_Win: function(){
      var id = this.id;
      this._DOM(id);
      this.id = id;
      this.win = this.$(id);
      this.content = this.$(id + "_content");

      this._CSS();
      this.show();
      this._drag();
      if (this.resizable) this._resize();
      this._clicks();
    },
    _DOM: function (id) {
      var html = '<div class="dragger" id="' + id + '_dragger"></div>';
      if (this.title)
        html += '<div class="title" id="' + id + '_title">' + this.title + '<div>';
      if (this.resizable)
        html += '<div class="resize" id="' + id + '_resize">' +
        '<div class="bar left"></div>' +
        '<div class="bar top"></div>' +
        '<div class="bar right"></div>' +
        '<div class="bar bottom"></div>' +
        '<div class="dot left-top"></div>' +
        '<div class="dot right-top"></div>' +
        '<div class="dot right-bottom"></div>' +
        '<div class="dot left-bottom"></div>' +
        '</div>';
      html += '<div class="btn-bar">';
      if (this.btnGroup[0])
        html += '<div class="btn btn-minimize" id="' + id + '_minimize"><div></div></div>';
      if (this.btnGroup[1])
        html += '<div class="btn btn-maximize" id="' + id + '_maximize"><div></div></div>';
      if (this.btnGroup[2])
        html += '<div class="btn btn-close" id="' + id + '_close"><div></div></div>';
      html += '</div><div class="content" id="' + id + '_content"></div>';
      var win = document.createElement("div");
      win.id = id;
      win.className = "window " + this.className;
      this.hide(win);
      win.innerHTML = html;
      this.$(this.containerId).appendChild(win);
    },
    _CSS: function () {
      var wins = window[this.group],
        zIndex;
      if (wins) {//初始化参数计算zIndex
        if (wins.global) {
          var g = wins.global;
          if (wins.length === 0) {//窗口全关闭了
            g.count = 1;
            g.z_index = 10000;
            this.index = 0;
            zIndex = 10000;
          } else {
            var preWin = wins[g.count - 1];
            this.unselect(preWin);//将前一个窗口取消选中选中
            this.index = g.count++;
            zIndex = ++g.z_index;
          }
        } else {
          //该组第一个窗口
          this.index = 0;
          //创建一个全局对象
          wins.global = {};
          var g = wins.global;
          g.count = 1;//当前窗口数
          g.z_index = 10000;//当前最前窗口 z-index
          zIndex = 10000;
          //点击document时最前窗口取消选中
          var self = this;
          var f = function() {
            var wins = window[self.group];
            if (wins.length === 0) return;
            var Win = wins[wins.length - 1];
            self.unselect(Win);
          }
          this.addEvent(document, "mousedown", f);
        }
        var style = document.createElement("style");
        style.id = this.id+"_style";
        style.innerHTML = "#"+this.id+"{"+
          "width:"+this.width+"px"+
          ";height:"+this.height+"px"+
          ";top:"+this.top+"px"+
          ";left:"+this.left+"px"+
          ";background-color:"+this.color+
          ";border:"+this.color+
          ";z-index:"+zIndex+
        ";}";
        this.win.appendChild(style);
      } else {
        /**
         * Win 实例需要放入数组内, 并在初始化时传入数组名称
         */
        throw new Error("instance" + this.id + " not in array group");
      }
    },
    _drag: function () {
      var self = this,
        win = this.win;
      this.addEvent(this.$(this.id + "_dragger"), "mousedown", function (e) {
        e = e || window.event;
        if (e.button == 2) return;
        var dragger = self.$(self.id + "_dragger");
        self.addClass(dragger, "dragging"); //保持鼠标形状
        var d = document,
          x = e.clientX || e.offsetX,
          y = e.clientY || e.offsetY,
          top = win.offsetTop,
          left = win.offsetLeft,
          moved,
          max = false,
          btn = self.$(self.id + "_maximize");
        if (btn && self.hasClass(btn, "max")) max = true;
        var dmove = function (e) {
            e = e || window.event;
            if (e.clientX === x && e.clientY === y) return;
            var b = document.body,
              tx = e.clientX - x + left,
              ty = e.clientY - y + top;
            var task = new Task();
            task.first(function(next){
              self.onDrag(e, tx, ty, next)
            }).then(function(){
              if (max) { //窗口最大化时拖动，缩放为原大小，但位置跟随鼠标
                max = false;
                self.removeClass(btn, "max");
                var t1 = self.width,
                t2 = b.clientWidth;
                if (x < t1 / 2)
                  left = 0;
                else if (x > t2 - t1 / 2)
                  left = t2 - t1;
                else
                  left = x - t1 / 2;
                left = left + b.scrollLeft;
                self.setCss({
                  width: self.width + "px",
                  height: self.height + "px",
                  top: b.scrollTop + "px",
                  left: left + "px"
                });
                self.left = left;
                self.show(self.$(self.id + "_resize"));
              } else {
                self.setCss({
                  left: tx + "px",
                  top: ty + "px"
                });
              }
              moved = true;
            }).start();
          },
          dup = function (e) {
            e.pageX = e.pageX || e.clientX + document.body.scrollLeft;
            self.removeClass(dragger, "dragging");
            self.removeEvent(d, "mousemove", dmove);
            self.removeEvent(d, "mouseup", dup);
            var _top = win.offsetTop,
              _left = win.offsetLeft;
            if (_top < -10 && e.pageX > 5 && self.btnGroup[1]) {
              self.maximize();
              self.top = 0;
            } else if (_top < 0) {
              self.top = 0;
              self.setCss({
                top: 0
              })
            } else if (moved) {
              self.top = _top;
              self.left = _left;
            }
          };
        self.addEvent(d, "mousemove", dmove);
        self.addEvent(d, "mouseup", dup);
      });
    },
    _resize: function () {
      var self = this,
        win = this.win;
      this.addEvent(this.$(this.id + "_resize"), "mousedown", function (e) {
        e = e || window.event;
        if (e.button == 2) return;
        var tg = e.srcElement ? e.srcElement : e.target,
          cls = tg.className.split(" ")[1],
          d = document,
          x = e.clientX || e.offsetX,
          y = e.clientY || e.offsetY,
          top = win.offsetTop,
          left = win.offsetLeft,
          width = win.offsetWidth,
          height = win.offsetHeight,
          style = self.$(self.id+"_style");
        var dmove = function (e) {
            e = e || window.event;
            if (!self.onResize(e)) return;
            var varianceX, varianceY;
            if (cls.indexOf("left") != -1) {
              varianceX = e.clientX - x;
              self.setCss({
                width: (width - varianceX) + "px",
                left: (left + varianceX) + "px"
              }, style);
            } else if (cls.indexOf("right") != -1) {
              varianceX = e.clientX - x;
              self.setCss({
                width: (width + varianceX) + "px",
              }, style);
            }
            if (cls.indexOf("top") != -1) {
              varianceY = e.clientY - y;
              self.setCss({
                height: (height - varianceY) + "px",
                top: (top + varianceY) + "px"
              }, style);
            } else if (cls.indexOf("bottom") != -1) {
              varianceY = e.clientY - y;
              self.setCss({
                height: (height + varianceY) + "px",
              }, style);
            }
          },
          dup = function () {
            self.removeEvent(d, "mousemove", dmove);
            self.removeEvent(d, "mouseup", dup);
            self.width = win.offsetWidth;
            self.height = win.offsetHeight;
            self.top = win.offsetTop;
            self.left = win.offsetLeft;
            if (self.top < -10) {//垂直高度最大化
              var _height = d.body.clientHeight;
              self.top = 0;
              self.setCss({
                height: _height + "px",
                top: 0
              });
            } else if (self.top < 0) {//使上边缘不超出屏幕
              self.top = 0;
              self.setCss({
                top: 0
              });
            }
          };
        self.addEvent(d, "mousemove", dmove);
        self.addEvent(d, "mouseup", dup);
      });
    },
    /**
     * 绑定鼠标点击事件
     * @return {[type]} [description]
     */
    _clicks: function () {
      var self = this;
      this.$(this.id + "_dragger").ondblclick = function (e) {
        e = e || window.event;
        self.stopPropagation(e);
        if (self.btnGroup[1]) self.maximize();
      };
      if (this.btnGroup[0])
        this.$(this.id + "_minimize").onclick = function (e) {
          e = e || window.event;
          self.stopPropagation(e);
          self.minimize();
        };
      if (this.btnGroup[1])
        this.$(this.id + "_maximize").onclick = function (e) {
          e = e || window.event;
          self.stopPropagation(e);
          self.maximize();
        };
      if (this.btnGroup[2])
        this.$(this.id + "_close").onclick = function (e) {
          e = e || window.event;
          self.stopPropagation(e);
          self.close();
        };
      this.win.onclick = function (e) {
        e = e || window.event;
        self.stopPropagation(e);
        self.onClick(e);
      };
      this.win.onmousedown = function (e) {
        e = e || window.event;
        self.stopPropagation(e);
        self.pushToFront();
        self.onMouseDown(e);
      };
    },
    /**
     * 最大化和还原
     * @return {[type]} [description]
     */
    maximize: function () {
      var b = document.body;
      var btn = this.$(this.id + "_maximize");
      var self = this;
      var task = new Task();
      if (!this.hasClass(btn, "max")) { //最大化
        task
          .first(function(next){
            self.preMaximize(next);
          })
          .then(function(next){
            self.setCss({
              width: b.clientWidth + "px",
              height: b.clientHeight + "px",
              top: b.scrollTop + "px",
              left: b.scrollLeft + "px"
            });
            self.addClass(btn, "max");
            self.hide(self.$(self.id + "_resize"));
            //控制还原时窗口位置不超出屏幕
            if (self.top < 0) self.top = 0;
            var t = b.clientWidth - self.width;
            if (self.left > t) self.left = t + b.scrollLeft;
            t = b.clientHeight;
            if (self.top > t - 45) self.top = t - 45 + b.scrollTop;
            next();
          })
          .then(function(){
            self.postMaximize();
          }).start();
      } else { //还原
        task
          .first(function(next){
            self.preReMaximize(next);
          })
          .then(function(next){
            self.setCss({
              width: self.width + "px",
              height: self.height + "px",
              top: self.top + "px",
              left: self.left + "px"
            });
            self.removeClass(btn, "max");
            self.show(self.$(self.id + "_resize"));
            next();
          })
          .then(function(){
            self.postReMaximize();
          }).start();
      }
      return this;
    },
    /**
     * 最小化
     * @return {[type]} [description]
     */
    minimize: function () {
      if (!this.preMinimize()) return this;
      this._minimize();
      this.postMinimize();
      return this;
    },
    _minimize: function () {
      console.warn("minimize is not implemented");
    },
    /**
     * 重新打开最小化的窗口
     * @return {[type]} [description]
     */
    reMinimize: function () {
      console.warn("reMinimize is not implemented");
    },
    /**
     * 关闭
     * @return {[type]} [description]
     */
    close: function () {
      var task = new Task(),
        self = this;
      task.first(function(next){
        self.preClose(next)
      })
      .then(function(next){
        self._close();
      })
      .then(function(next){
        self.postClose();
      })
      .start();
      return this;
    },
    _close: function () {
      var wins = window[this.group],
        i = this.index,
        win = wins[i].win;
      win.parentNode.removeChild(win);
      wins.splice(i, 1);
      for (; i < wins.length; i++) {
        wins[i].index--;
      }
      wins.global.count--;
      if (wins.length > 0) {
        var Win2 = wins[wins.length - 1];
        this.select(Win2);
      }
    },
    /**
     * 把窗口放到数组末尾、最前显示
     * @return {[type]} [description]
     */
    pushToFront: function () {
      var win = this.win,
        wins = window[this.group],
        zIndex = this.getCss(["z-index"])[0];
        g = wins.global;
      if (wins.length === 0 || zIndex == g.z_index || wins.length === 1) {
        if (this.hasClass(win, "unselected")) {
          this.select();
        }
        return this;
      }
      var i = this.index;
      wins.splice(i, 1);
      wins.push(this);
      this.index = wins.length - 1;
      var preWin = wins[wins.length - 2];
      this.select().unselect(preWin);
      for (; i < wins.length - 1; i++) {
        wins[i].index--;
      }
      return this;
    },
    /**
     * 把窗口放到数组头部、最后显示
     * @return {[type]} [description]
     */
    pushToHead: function () {
      var win = this.win,
        wins = window[this.group];
      if (!wins || wins.length < 2) return this;
      var g = wins.global,
        i = this.index,
        t = i;
      for (; t > 0; t--) {
        wins[t] = wins[t - 1];
        wins[t].index++;
      }
      wins[0] = this;
      wins[0].index = 0;
      this.setCss({
        z_index: wins[1].win.style.zIndex - 1
      });
      var frontWin = wins[wins.length - 1]; //最前显示的窗口
      this.unselect().select(frontWin);
      return this;
    },

    unselect: function (Win) {
      var Win = Win || this;
      if (this.addClass(Win.win, "unselected")) {
        var style = this.$(Win.id+"_style");
        this.setCss({
          background_color: "#fff",
          border: "1px solid #b5b9c0"
        }, style);
      }
      return this;
    },
    select: function (Win) {
      var Win = Win || this,
        color = Win.color;
      this.removeClass(Win.win, "unselected");
      var style = this.$(Win.id+"_style");
      this.setCss({
        background_color: color,
        border: "1px solid " + color,
        z_index: ++window[Win.group].global.z_index
      }, style);
      return this;
    },
    addEvent: function (ele, type, cb) {
      if (ele.addEventListener) {
        ele.addEventListener(type, cb, false);
      } else if (ele.attachEvent) {
        ele.attachEvent('on' + type, cb);
      } else {
        ele['on' + type] = cb;
      }
    },
    removeEvent: function (ele, type, cb) {
      if (ele.removeEventListener) {
        ele.removeEventListener(type, cb, false);
      } else if (ele.detachEvent) {
        ele.detachEvent('on' + type, cb);
      } else {
        ele['on' + type] = null;
      }
    },
    stopPropagation: function (e) {
      if (e.stopPropagation) {
        e.stopPropagation();
      } else {
        e.cancelBubble = true;
      }
    },
    /**
     * 设置样式(标签中只有一个类)
     * @param {[type]} obj   [description]
     * @param {[type]} style [description]
     */
    setCss: function(obj, style){
      var style = style||this.$(this.id+"_style"),
        css = style.innerHTML,
        regs = "";
      for(var key in obj){
        regs = "([;\\{]\\s*"+key.replace("_","-")+"\\s*:\\s*)[^;]*([;\\}]{1,2})";
        css = css.replace(new RegExp(regs), "$1"+obj[key]+"$2");
      }
      style.innerHTML = css;
    },
    /**
     * 获取样式(标签中只有一个类)
     * @param  {[type]} arr [description]
     * @return {[type]}     [description]
     */
    getCss: function(arr){
      var style = this.$(this.id+"_style"),
        css = style.innerHTML,
        regs = "",
        i = 0;
      for(;i<arr.length;i++){
        regs = ".*\\b"+arr[i].replace("_","-")+"\\s*:\\s*([^;]*)[;\\}]";
        var match = css.match(new RegExp(regs));
        if(match)
          arr[i] = match[1];
        else arr[i] = "";
      }
      return arr;
    },
    hide: function(win){
      var win = win||this.win;
      win.style.visibility = "hidden";
    },
    show: function(win){
      var win = win||this.win;
      win.style.visibility = "visible";
    },

    $: function (s) {
      return document.getElementById(s);
    },
    /**
     * 加一个类名
     * @param {[type]} obj  [description]
     * @param {[type]} cls  [description]
     * @param {[type]} flag true时无论原来有无都在后面添加
     */
    addClass: function (obj, cls, flag) {
      if (!flag&&this.hasClass(obj, cls)) return false;
      var obj_class = obj.className,
        blank = (obj_class !== '') ? ' ' : '';
      added = obj_class + blank + cls;
      obj.className = added;
      return true;
    },
    removeClass: function (obj, cls) {
      var obj_class = ' ' + obj.className + ' ';
      obj_class = obj_class.replace(/(\s+)/gi, '  ');
      var removed = obj_class.replace(new RegExp("\\s"+cls+"\\s", "g"), ' ');
      removed = removed.replace(/(^\s+)|(\s+$)/g, '');
      obj.className = removed;
    },
    hasClass: function (obj, cls) {
      var classes = obj.className,
        class_lst = classes.split(/\s+/);
      x = 0;
      for (; x < class_lst.length; x++) {
        if (class_lst[x] == cls) {
          return true;
        }
      }
      return false;
    }
  };

  window.Win = Win;
})();
