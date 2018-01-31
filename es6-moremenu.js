/**
 * ES6 MoreMenu module
 * @author Jonas van Ineveld
 *
 * Inserts another menu just after the current menu.
 * This menu will hold all the 'not fitting' menu items
 * It checks the outer width of each item, and theire margins,
 * Then calculates how many will fit keeping in mind the size of the more link,
 *
 * USAGE:
 * var mm = new moreMenu(document.getElementById('menu'), {options});  // takes optional argument (Object)options
 *
 * CREDITS:
 * throttle and CustomEvent polyfill from dev moz docs
 * * https://developer.mozilla.org/en-US/docs/Web/Events/resize
 * * https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent#Polyfill
*/
export default class {
	constructor(menuTarget, custom_settings = {}) {
    	if(!menuTarget){
			return;
		}

		this.menu_items = [];										// (array) all the menu items
		this.$moreMenu = {};										// (element) will hold more menu contents
		this.$classTarget = {};										// (element) will hold target class element
		this.$moreLink = {};										// (element) will hold more link
		this.$menu = document.querySelector(menuTarget);			// (element) will hold main menu element
		this.moreItemWidth = 0;										// (float) will hold calculated width of the more link
		this.lastMenuWidth = 0;										// (float) keeps value of latest menu width, this is to prevent useless calculations
		this.settings = {};											// (object) will hold the settings

		let default_settings = {
			more_link_contents: '<a href="#">More..</a>', 			// more link contents
			sub_tag_type: 'ul',										// type of tag for the submenu, depends on the type of used menu items
			extra_offset: 1,										// how much earlier should a menu item move into the more menu? how much space should there horizontaly be left (on the right)? default 1px
			check_for_resize: true									// should we check for browser resizing?
		};

		Object.assign(this.settings, default_settings, custom_settings); // merge default and custom settings

		this.refresh_menu_items();
		this.create_more_menu();
		this.create_more_menu_link();
		this.move_unfitting_items();

		if(this.get_option('check_for_resize'))
		{
			this.init_throttle();
			this.check_for_resizing();
		}

		let c_event = new CustomEvent("mm_initialized");
		this.$menu.dispatchEvent(c_event, this);
  	}

	// retrieves option from the merged opbject
	get_option(_setting){
		return this.settings[_setting];
	}

	// calculates width of a item
	calc_item_width($item){
		let { clientWidth : width } = $item;
		return width;
	}

	// refreshes the menu items array
	refresh_menu_items(){
		let $menu_items = this.$menu.children;
		let menu_items = []; // clear

		for(let menu_item of $menu_items){
			menu_items.push({
				$element: menu_item,
				width: this.calc_item_width(menu_item)
			});
		}

		this.menu_items = menu_items;
	}

	// creates the more menu and inserts it
	create_more_menu(){
		let {$moreMenu} = this;

		$moreMenu = document.createElement(this.get_option('sub_tag_type'));
		$moreMenu.className = 'more-menu';

		this.$moreMenu = $moreMenu;
	}

	// creates the more menu link and inserts it
	create_more_menu_link(){
		let {$moreLink: $link, $menu, $moreMenu} = this;

		$link = document.createElement("li");
		$link.className = 'more-menu-link';

		$link.innerHTML = this.get_option('more_link_contents');
		$menu.appendChild($link);

		$link.appendChild($moreMenu);

		this.moreItemWidth = this.calc_item_width($link);
		this.$moreLink = $link;
	}

	// should moremenu link be visible?
	check_more_menu_link_visibility(){
		let {$moreLink: $link, $moreMenu} = this;
		let itemsInMoreMenu = $moreMenu.children.length;	// does the more menu have any childs?

		if(itemsInMoreMenu){
			$link.style.display = '';
		}
		else{
			$link.style.display = 'none';
		}
	}

	// calculate and move items
	move_unfitting_items(){
		let {$menu, menu_items, $moreMenu, moreItemWidth, lastMenuWidth: last_width, $moreLink} = this,
			menuWidth = this.calc_item_width($menu),
			availableWidth = menuWidth - moreItemWidth - this.get_option('extra_offset'), // inner width of menu
			indexWidth = 0; // holds current offset in the width calculation

		if( last_width === menuWidth){ 	// prevents unnecessary recalculations
			return;
		}
		else{
			last_width = menuWidth;
		}

		for(let menu_item of menu_items){
			let $menu_item = menu_item.$element,
				totalItemWidth = menu_item.width;

			if(indexWidth + totalItemWidth > availableWidth){
				$moreMenu.appendChild($menu_item);
			}
			else{
				$menu.appendChild($menu_item);
			}

			indexWidth += totalItemWidth;
		}

		this.check_more_menu_link_visibility(); // should more link still be visible?

		$menu.appendChild($moreLink);

		let c_event = new CustomEvent("mm_moved_items");
		$menu.dispatchEvent(c_event, this);
	}

	// should we check for resizing? sets event listener
	check_for_resizing(){
		if(!this.get_option('check_for_resize'))
		{
			return;
		}

		window.addEventListener("throttled_resize", () => this.move_unfitting_items() );
	}

	// throttle function from mozilla dev
	init_throttle(){
		var throttle = function(type, name, obj) {
			obj = obj || window;
			var running = false;
			var func = function() {
				if (running) { return; }
				running = true;
				 requestAnimationFrame(function() {
					obj.dispatchEvent(new CustomEvent(name));
					running = false;
				});
			};
			obj.addEventListener(type, func);
		};

		throttle("resize", "throttled_resize");
	}
}

// custome event function fallback from mozilla dev
(function () {

  if ( typeof window.CustomEvent === "function" ) { return false; }

  function CustomEvent ( event, params ) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
    return evt;
   }

  CustomEvent.prototype = window.Event.prototype;

  window.CustomEvent = CustomEvent;
})()
