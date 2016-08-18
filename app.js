(function () {
  'use strict';

  // poor man's event delegation
  // TODO - upper limit on this recursion

  function delegate(el, selector, parent) {
      // walked all the way up or like, asplode
      if (!el || el === parent) {
          return;
      }

      // fount it!
      if (el.matches(selector)) {
          return el;
          // lets walk up another level
      } else {
          return delegate(el.parentNode, selector, parent);
      }
  }

  function addEventDelegateListener(el, eventName, selector, handler) {
      var fn = function fn(e) {
          var delegateTarget = delegate(e.target, selector, el);
          if (delegateTarget) {
              handler(e, delegateTarget);
          }
      };
      el.addEventListener(eventName, fn);
      return function removeEventDelegateListener() {
          el.removeEventListener(eventName, fn);
      };
  }

  function pokeDOM() {
      return document.body.offsetLeft;
  }

  function getScrollTop() {
      return document.body.scrollTop || document.documentElement.scrollTop;
  }

  var classCallCheck = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };

  var createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var baffleConfig = { characters: " ░▒▓█</>" };

  var PortfolioItem = function () {
      function PortfolioItem(navEl) {
          var _this = this;

          classCallCheck(this, PortfolioItem);

          this.navEl = navEl;
          this.id = navEl.hash.slice(1);
          this.portfolioEl = document.getElementById(this.id);
          this.cacheOffsetTop();

          this.selected = false;

          // make mouseover title trigger baffle effect
          var titleEl = this.portfolioEl.querySelector(".item-title");
          this.b = baffle(titleEl, baffleConfig);
          titleEl.addEventListener("mouseover", function (e) {
              _this.baffleTitle();
          });

          // NOTE - working around css transtions not working
          // on elements with dimensions set by "auto"
          this.navEl.classList.add("selected");
          pokeDOM();
          this.navElExpandedWidth = window.getComputedStyle(this.navEl).width;
          this.navEl.classList.remove("selected");

          // add explicit widths on hover to 
          // enable css transitions
          this.navEl.addEventListener("mouseover", function (e) {
              _this.navEl.style.width = _this.navElExpandedWidth;
          });
          this.navEl.addEventListener("mouseout", function (e) {
              if (!_this.selected) {
                  _this.navEl.style.removeProperty("width");
              }
          });
      }

      // cache offsetTop to avoid expensive DOM lookups


      createClass(PortfolioItem, [{
          key: "cacheOffsetTop",
          value: function cacheOffsetTop() {
              this.offsetTop = this.portfolioEl.offsetTop;
          }

          // select nav el

      }, {
          key: "select",
          value: function select() {
              if (!this.selected) {
                  this.baffleTitle();
                  this.selected = true;
                  this.navEl.classList.add("selected");
                  this.navEl.style.width = this.navElExpandedWidth;
              }
          }

          // deselect nav

      }, {
          key: "deselect",
          value: function deselect() {
              if (this.selected) {
                  this.selected = false;
                  this.navEl.classList.remove("selected");
                  this.navEl.style.removeProperty("width");
              }
          }

          // apply baffle effect to portfolio item title

      }, {
          key: "baffleTitle",
          value: function baffleTitle() {
              // TODO - baffle seems to ignore numbers
              // higher than 1000 here :/
              this.b.reveal(1000);
          }
      }]);
      return PortfolioItem;
  }();

  var bodyEl = document.body;
  var lastScrollPos = getScrollTop();
  var scrollSensitivity = 70;
  var offsetPadding = 65;
  var navItemEls = document.querySelectorAll(".nav-item");
  var App = function () {
      function App() {
          var _this = this;

          classCallCheck(this, App);

          this.items = Array.prototype.map.call(navItemEls, function (el) {
              return new PortfolioItem(el);
          });

          // once the entire document has loaded, recalculate offsets
          window.addEventListener("load", function (e) {
              _this.refreshNavSelection();
          });

          // on resize, recalculate offsets
          window.addEventListener("resize", function (e) {
              // TODO - debounce
              _this.refreshNavSelection();
          });

          // as the page scrolls, select the appropriate nav el
          window.addEventListener("scroll", function (e) {
              if (Math.abs(getScrollTop() - lastScrollPos) > scrollSensitivity) {
                  _this.selectMostVisibleItem();
              }
          });

          // lazy load images
          new Blazy({
              success: function success(el, msg) {
                  // if its a gif, add a play button
                  if (el.matches(".gifify")) {
                      el.setAttribute("data-gifffer", el.getAttribute("src"));
                      Gifffer();
                  }

                  // image size was just a placeholder, so kill it
                  el.style.width = "unset";
                  el.style.height = "unset";

                  // image load means portfolio offsets
                  // may have changed, so update em
                  app.refreshNavSelection();
              }
          });

          // make all non-local links open in new tab
          Array.prototype.forEach.call(document.querySelectorAll("a"), function (el) {
              if (!el.href.includes(document.location.origin)) {
                  el.setAttribute("target", "_blank");
              }
          });

          // make nav clickies select the nav element
          addEventDelegateListener(document.querySelector(".main-nav"), "click", ".nav-item", function (e, target) {
              _this.getPortfolioItemForNavEl(target);
          });

          // figure out which portfolio item is visible and select it
          this.refreshNavSelection();
      }

      createClass(App, [{
          key: "getPortfolioItemForNavEl",
          value: function getPortfolioItemForNavEl(el) {
              for (var i = 0; i < this.items.length; i++) {
                  if (this.items[i].navEl == el) {
                      return this.items[i];
                  }
              }
          }
      }, {
          key: "selectPortfolioItem",
          value: function selectPortfolioItem(portfolioItem) {
              this.items.forEach(function (item) {
                  if (item === portfolioItem) {
                      item.select();
                  } else {
                      item.deselect();
                  }
              });
          }

          // accessing offsetTop triggers a reflow, so cache
          // it when possible
          // TODO - debounce

      }, {
          key: "updatePortfolioItemOffsets",
          value: function updatePortfolioItemOffsets() {
              this.items.forEach(function (item) {
                  return item.cacheOffsetTop();
              });
          }
      }, {
          key: "calculateMostVisiblePortfolioItem",
          value: function calculateMostVisiblePortfolioItem() {
              lastScrollPos = getScrollTop();
              var item = void 0,
                  offsetTop = void 0;

              // TODO - maybe rank items by most pixels in view?

              // if near the end, select the last item
              if (bodyEl.scrollHeight - lastScrollPos - bodyEl.clientHeight < scrollSensitivity) {
                  return this.items[this.items.length - 1];
              }

              // otherwise, figure out which item is nearest top
              for (var i = this.items.length - 1; i >= 0; i--) {
                  item = this.items[i];
                  offsetTop = item.offsetTop - offsetPadding;

                  if (offsetTop < lastScrollPos) {
                      return item;
                  }
              }

              // must be way up topsies, so select first
              //return this.items[0];
          }
      }, {
          key: "selectMostVisibleItem",
          value: function selectMostVisibleItem() {
              // see if selection should be updated
              var mostVisible = this.calculateMostVisiblePortfolioItem();
              if (mostVisible !== this.mostVisible) {
                  this.mostVisible = mostVisible;
                  this.selectPortfolioItem(mostVisible);
              }
          }
      }, {
          key: "refreshNavSelection",
          value: function refreshNavSelection() {
              // update offsets cache
              this.updatePortfolioItemOffsets();
              // make sure the right nav el is selected after
              // calculating new offsets
              this.selectMostVisibleItem();
          }
      }]);
      return App;
  }();

  var app = new App();

}());

//# sourceMappingURL=app.js.map
