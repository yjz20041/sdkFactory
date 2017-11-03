(function(context, factory){
  if(context.define){
    define([], factory());
  }else if(typeof module === "object" && typeof module.exports === "object"){
    module.exports = factory();
  }

  window.NEP = factory();

})(window, function(){
  var
    NEPDomain = '$((baseUrl))',
    // NEPDomain = 'http://test.163.com:8081',
    NEPServer = NEPDomain;
  var
    _r = [],
    _o = {},
    _f = function(){},
    slice = _r.slice,
    concat = _r.concat,
    util = {
      _$type: function(o){
        var
          r = /^\[object\s(.*)\]$/;
        return {}.toString.call(o).match(r)[1].toLowerCase();
      },

      _$isObject: function(o){
        return this._$type(o) == 'object' || (typeof o === 'object' && typeof o.nodeType === 'number' &&  typeof o.nodeName === 'string') || o == window;
      },

      _$isArray: function(a){
        return this._$type(a) == 'array';
      },

      _$isString: function(s){
        return this._$type(s) == 'string';
      },

      _$isNumber: function(n){
        return this._$type(n) == 'number';
      },

      _$isFunction: function(f){
        return this._$type(f) == 'function';
      },

      _$isBoolean: function(b){
        return this._$type(b) == 'boolean';
      },

      _$merge: function(deep){
        var
          target,
          srcArray;
        if(util._$isBoolean(deep)){
          target = util._$isObject(arguments[1]) || util._$isArray(arguments[1]) ? arguments[1] :{};
          srcArray = slice.call(arguments, 2);
        }else{
          target = util._$isObject(deep) || util._$isArray(deep) ? deep : {};
          srcArray = slice.call(arguments, 1);
        }

        util._$foreach(srcArray,function(src){
          if(util._$isObject(src) || util._$isArray(src)){
            util._$foreach(src,function(val, key){
              if(deep === true && (util._$isObject(val) || util._$isArray(val))){
                target[key] = util._$isObject(val) ? {} : [];
                util._$merge(deep, target[key], val);
              }else{
                target[key] = val;
              }
            })
          }
        });

        return target;
      },

      _$foreach: function(obj, callback){
        var
          i = 0,
          key;

        if(!util._$isFunction(callback)) return;
        if(util._$isArray(obj) || (obj && obj.length != undefined)){
          for(; i < obj.length; i ++){
            if(callback.call(obj[i], obj[i], i)) break;
          }
        }else if(util._$isObject(obj)){
          for(key in obj){
            if(callback.call(obj, obj[key], key)) break;
          }
        }
      },

      _$bind: function(fun, context){

        return function(){
          fun.apply(context, arguments);
        }
      },

      _$removeCss: function(dom, name){
        if(dom.style.removeProperty){
          dom.style.removeProperty(name);
        }else{
          dom.style.removeAttribute(name);
        }
      },

      _$concat: function(){
        var
          ret = [],
          i;
        util._$foreach(slice.call(arguments), function(o){
          for( i = 0; i < o.length; i ++){
            ret.push(o[i]);
          }
        })
        return ret;
      },

      _$wait: function(_this, key, cb){
        var
          timer,
          maxCount = 100;
        if(_this[key]){
          cb();
        }else{
          timer = setInterval(function(){
            maxCount --;
            if(maxCount < 0){
              clearInterval(timer);
            }else if(_this[key]){
              cb();
              clearInterval(timer);
              timer = null;
            }
          }, 300)
        }
      }
    },
    evt = {
      _addCommonEvent: function(obj, type, handler){
        if(util._$isFunction(handler)){
          obj['on' + type] = handler;
        }
      },

      _$add: function(obj, type, handler){

        if(!util._$isObject(obj)) return;

        if(!obj.events) obj.events = {};

        if(util._$isString(type) && util._$isFunction(handler)){

          obj.events[type] || (obj.events[type] = []);
          obj.events[type].push(handler);
          obj.events[type].handler = mainHandler;
          if(('on' + type) in document ){
            this._addCommonEvent(obj, type, mainHandler);
          }
        }

        function mainHandler(event){
          util._$foreach(obj.events[type], function(handler){
            return handler.call(handler, event) == false;//stop if any handler return false
          })
        }

      },

      _$remove: function(obj, type, handler){
        var
          handlers,
          i = 0,
          l;
        if(obj.events){
          handlers = obj.events[type];
          l = handlers.length;
          for(; i < l; i ++ ){
            if(!handler){
              handlers.pop();
            }else if(util._$isFunction(handler) && handler == handlers[i]){
              handlers.splice(i, 1);
              break;
            }
          }
          if(!handlers.length){
            obj['on' + type] = null;
          }
        }
      },

      _$trigger: function(obj, type, data){
        try{
          obj.events[type].handler({
            type: type,
            data: data
          })
        }catch(e){

        }

      },

      _$on: function(node, type, handler, capture){
        node.addEventListener ? node.addEventListener(type, handler, capture) : node.attachEvent('on' + type, handler);
      }
    },

    postMessage = {
      _$listen: function(win, callback, speed){
        if('onmessage' in win){
          win.onmessage = function(e){
            e = e || win.event;
            var
              data = JSON.parse(e.data);
            callback(data);
          }
        }else{
          setInterval(function(){
            var
              nameJson,
              i = 0,
              l,
              data;
            nameJson = JSON.parse(win.name || '{}');
            nameJson.message || (nameJson.message = []);
            l = nameJson.message.length;
            for(; i< l; i++){
                data = nameJson.message[0];
                callback(data);
                nameJson.message.pop();
            }
            win.name = json._$stringify(nameJson);
          }, speed || 100);
        }
      },
      _$post: function(win, message){
        var
          nameJson;

        if('postMessage' in win){
          win.postMessage(JSON.stringify(message), '*');
        }else{
          nameJson = JSON.parse(win.name || '{}');
          nameJson.message || (nameJson.message = []);
          nameJson.message.push(message);
          win.name = json._$stringify(nameJson);

        }
      }
    };

  var
    NEP = function(options){
      options = options || {};

      //message dispatcher
      this.__dispatcher = {};
      this.__registerUrl = encodeURIComponent(options.registerUrl || '');

      this.__createBody(options);
      this.__bindMessage(options);

      this.__retryCheckTokenIframeReadyTime = 1000;
      this.__retryCheckTokenIframeReadyCount = 0;
      // 最大重复check ready次数， -1表示不限制
      this.__retryCheckTokenIframeReadyMaxCount = 2;
    },
    pro = NEP.prototype;

  pro.__createBody = function(options){

    //the default container is a dialog
    if(!this.__container){
      this.__body = document.createElement('div');
      this.__body.style.cssText = 'position: absolute; left: 50%; top: 50%; width: 405px; height: 446px; margin-left: -202.5px; margin-top: -223px; padding-top: 30px; background: white; overflow: hidden; z-index: 9999;'
      this.__addMask();
      this.__addCloseIcon();
      this.__nMask.appendChild(this.__body);
    }else{
      this.__body = this.__container;
    }

    if(options.hide === true){
      this._$hide();
    }

    this.__addBodyIframe(NEPServer + '/sdk-login?target=' + (options.target || '') + '&registerUrl=' + this.__registerUrl);
    this.__addGetTokenIframe();
  }

  pro.__addMask = function(){
    this.__nMask =  document.createElement('div');
    this.__nMask.style.cssText = 'position: fixed; left: 0; top: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.4);  z-index: 9998;';
    document.body.appendChild(this.__nMask);
    document.body.style.overflow = "hidden";

  }

  pro.__removeMask = function(){
    if(this.__nMask){
      util._$removeCss(document.body, 'overflow');
      document.body.removeChild(this.__nMask);
      delete this.__nMask;
    }
  }

  pro.__addCloseIcon = function(){
    var
      nClose;
    nClose = this.__nClose = document.createElement('i');

    this.__nClose.style.cssText = 'position: absolute; top: 15px; right: 15px; width: 14px; height: 14px; background: url(' + NEPServer + '/res/images/close-x1.png) no-repeat 0 center;'
      + 'background-image: -webkit-image-set(url(' + NEPServer + '/res/images/close-x2.png) 2x); cursor: pointer;';
    this.__body.appendChild(this.__nClose);

    evt._$add(this.__nClose, 'click', util._$bind(this.__onClose, this));
    evt._$add(this.__nClose, 'mouseenter', function(){
      nClose.style.backgroundPosition = '-14px center';
    })
    evt._$add(this.__nClose, 'mouseleave', function(){
      nClose.style.backgroundPosition = '0 center';
    })
  }

  pro.__onClose = function(event){
    //this._$close();
    this._$hide();
  }

  pro.__addBodyIframe = function(url){
    this.__nBodyIframe = document.createElement('iframe');
    this.__nBodyIframe.frameBorder = 0;
    this.__nBodyIframe.style.cssText = 'width: 100%; height: 100%; overflow: hidden;'
    this.__nBodyIframe.src = url;
    this.__body.appendChild(this.__nBodyIframe);
  }


  pro.__addGetTokenIframe = function(){
    var _self = this;
    this.__nGetTokenIframe = document.createElement('iframe');
    this.__nGetTokenIframe.style.display = 'none';
    this.__nGetTokenIframe.src = NEPServer + '/get-token';
    evt._$on(this.__nGetTokenIframe, 'load', function () {
      console.log('token iframe onload')
      _self.__checkGetTokenIframeReady();
    });
    this.__body.appendChild(this.__nGetTokenIframe);
  }

  pro.__checkGetTokenIframeReady = function () {
    var _self = this;
    // TODO: 现在dispatchMessage, 如果第一个失败了，会堵塞后面的重试
    // 直接修改this.__dispatcher['ready']，求更完善的方案
    // this._dispatchMessage('ready', util._$bind(this.__onGetTokenIframeLoaded, this));
    if (
      this.__retryCheckTokenIframeReadyMaxCount !== -1 &&
      this.__retryCheckTokenIframeReadyCount > this.__retryCheckTokenIframeReadyMaxCount
    ) {
      return false;
    }
    console.log('nep: check token iframe ready')
    this.__dispatcher['ready'] = {
      callback: function () { _self.__onGetTokenIframeLoaded(); }
    };
    this.__nGetTokenIframe.contentWindow.postMessage('ready', '*');
    this.__retryCheckTokenIframeReadyCount++;
    clearTimeout(_self.__retryCheckTokenTimer);
    _self.__retryCheckTokenTimer = setTimeout(function () {
      if (!_self.__getTokenIframeReadyState) {
        // 重试
        _self.__checkGetTokenIframeReady();
      }
    }, _self.__retryCheckTokenIframeReadyTime);
  }

  pro.__onGetTokenIframeLoaded = function(){
    this.__getTokenIframeReadyState = true;
    console.log('nep: check token iframe has ready')
  }

  pro.__bindMessage = function(options){

    evt._$on(window, 'message', util._$bind(function(event){
      event = event || window.event;
      var
        origin = event.origin,
        source = event.source,
        data = event.data,
        result;

      try{
        data = JSON.parse(data);
      }catch(e){

      }

      if(source != this.__nGetTokenIframe.contentWindow && source != this.__nBodyIframe.contentWindow) return;
      //identify the origin
      /*if(origin != NEPDomain){
        return false;
      }*/

      if(data.name == 'updateHeight'){
        this.__body.style.height = data.value + 30 + 'px';
      }else if(data.name == 'login'){

        if(util._$isFunction(options.onLogin)){
          options.onLogin(data.token);
        }
        if(data.token){
          localStorage.setItem('user_token', JSON.stringify(data.token));
        }


      }else if(data.name == 'logout'){
        if(util._$isFunction(options.onLogout)){
          options.onLogout(data.result);
        }

        if(data.result){
          localStorage.removeItem('user_token');
        }

      }

      //transfer the name of token to getToken, because we can not change the message name
      //original in order to compatible with the console sdk.
      if(data.name == 'token'){
        data.name = 'getToken';
      }
      if(util._$isFunction(this.__dispatcher[data.name] && this.__dispatcher[data.name].callback)){

        this.__dispatcher[data.name].callback(data.name == 'getToken' ? data.token : data);

      }


    }, this));

  }

  pro._$getToken = function(cb){
    this._dispatchMessage('getToken', cb);
  }

  pro._$logout = function(){

    this._dispatchMessage('logout');
  }

  /**
    * dispatch the message
    * @param {String} name - message name
    * @param {Function} callback - the callback of message
    * @return {None}
    */
  pro._dispatchMessage = function(name, callback){
    util._$wait(this, '__getTokenIframeReadyState', util._$bind(function(){
      var
        queue;
      queue = this.__dispatcher[name] = this.__dispatcher[name] || [];

      queue.push({
        name: name,
        callback: callback
      });

      this._postMesaage(queue);

    }, this))

  }

  /**
    * post a type of message from the corresponding queue.
    * @param {Array} queue -  a type of message queue
    * @return {None}
  */
  pro._postMesaage = function(queue){
    var
      task;
    if(!queue.length){
      queue.process = false;
      delete queue.callback;
      return;
    }
    if(!queue.process){
        queue.process = true;
        task = queue.shift();
        this.__nGetTokenIframe.contentWindow.postMessage(task.name, '*');
        queue.callback = util._$bind(function(ret){

          if(typeof task.callback == 'function'){
            task.callback(ret);
          }
          queue.process = false;
          //post the rest message
          this._postMesaage(queue);

        }, this);
      }
  }


  /**
   * show the dialog
   * @param  {String} target - the url of new window after logined successful.
   * @return {None}
   */
  pro._$show = function(target){
    if(target){
      this.__nBodyIframe.src = NEPServer + '/sdk-login?target=' +target + '&registerUrl=' + this.__registerUrl;
    }
    //util._$removeCss(this.__body, 'display');
    util._$removeCss(this.__nMask, 'display');
    document.body.style.overflow = "hidden";
  }

  pro._$hide = function(){
    this.__nMask.style.display = 'none';
    //this.__body.style.display = 'none';
    util._$removeCss(document.body, 'overflow');
  }

  pro._$close = function(){
    if(!this.__container){
      this.__removeMask();
      //document.body.removeChild(this.__body);
    }

  }


  return NEP;

})




