YAHOO.namespace("lacuna.buildings");

if (typeof YAHOO.lacuna.buildings.Shipyard == "undefined" || !YAHOO.lacuna.buildings.Shipyard) {
	
(function(){
	var Lang = YAHOO.lang,
		Util = YAHOO.util,
		Dom = Util.Dom,
		Event = Util.Event,
		Sel = Util.Selector,
		Lacuna = YAHOO.lacuna,
		Game = Lacuna.Game,
		Lib = Lacuna.Library;

	var Shipyard = function(result){
		Shipyard.superclass.constructor.call(this, result);
		
		this.service = Game.Services.Buildings.Shipyard;
	};
	
	Lang.extend(Shipyard, Lacuna.buildings.Building, {
		getChildTabs : function() {
			return [this._getQueueTab(), this._getBuildTab()];
		},
		_getQueueTab : function() {
			var queueTab = new YAHOO.widget.Tab({ label: "Build Queue", content: '<div><ul class="shipQueue shipQueueHeader clearafter"><li class="shipQueueType">Type</li><li class="shipQueueEach">Time To Complete</li></ul><div id="shipsBuilding"></div></div>'});
			queueTab.subscribe("activeChange", function(e) {
				if(e.newValue) {
					this.getQueue();
				}
			}, this, true);
					
			this.queueTab = queueTab;
			
			return queueTab;
		},
		_getBuildTab : function() {
											
			var buildTab = new YAHOO.widget.Tab({ label: "Build Ships", content: [
				'<div>',
				'	<div class="shipHeader">There are <span id="shipDocksAvailable">0</span> docks available for new ships.</div>',
				/*'	<ul class="shipHeader shipInfo clearafter">',
				'		<li class="shipType">Type</li>',
				'		<li class="shipCost">Cost</li>',
				'		<li class="shipAttributes">Attributes</li>',
				'		<li class="shipBuild">Build</li>',
				'	</ul>',
				'	<div id="shipDetails">',
				'	</div>',*/
				'	<div style="height:300px;overflow:auto;">',
				'		<ul id="shipDetails">',
				'		</ul>',
				'	</div>',
				'</div>'
			].join('')});
			
			buildTab.subscribe("activeChange", function(e) {
				if(e.newValue) {
					this.getBuild();
				}
			}, this, true);
					
			this.buildTab = buildTab;
			
			return buildTab;
		},
		
		getBuild : function() {
			if(!this.ships) {
				Lacuna.Pulser.Show();
				this.service.get_buildable({session_id:Game.GetSession(),building_id:this.building.id}, {
					success : function(o){
						YAHOO.log(o, "info", "Shipyard.getBuild.get_buildable.success");
						Lacuna.Pulser.Hide();
						this.fireEvent("onMapRpc", o.result);
						var sda = Dom.get("shipDocksAvailable");
						if(sda) {
							sda.innerHTML = o.result.docks_available;
						}
						this.ships = {
							buildable: o.result.buildable,
							docks_available: o.result.docks_available
						};
						this.ShipPopulate();
					},
					failure : function(o){
						YAHOO.log(o, "error", "Shipyard.getBuild.get_buildable.failure");
						Lacuna.Pulser.Hide();
						this.fireEvent("onMapRpcFailed", o);
					},
					timeout:Game.Timeout,
					scope:this
				});
			}
			else {
				this.ShipPopulate();
			}
		},
		getQueue : function() {
			if(!this.ship_build_queue) {
				Lacuna.Pulser.Show();
				this.service.view_build_queue({session_id:Game.GetSession(),building_id:this.building.id,page_number:1}, {
					success : function(o){
						YAHOO.log(o, "info", "Shipyard.getQueue.view_build_queue.success");
						Lacuna.Pulser.Hide();
						this.fireEvent("onMapRpc", o.result);
						this.ship_build_queue = o.result;
						this.ShipyardDisplay();
					},
					failure : function(o){
						YAHOO.log(o, "error", "Shipyard.getQueue.view_build_queue.failure");
						Lacuna.Pulser.Hide();
						this.fireEvent("onMapRpcFailed", o);
					},
					timeout:Game.Timeout,
					scope:this
				});
			}
			else {
				this.ShipyardDisplay();
			}
		},
		
		ShipyardDisplay : function() {
			var bq = this.ship_build_queue;
			/*= {
				number_of_ships_building: o.result.number_of_ships_building,
				ships_building: o.result.ships_building
			};*/
			if(bq.ships_building && bq.ships_building.length > 0) {
				var div = Dom.get("shipsBuilding"),
					ul = document.createElement("ul"),
					li = document.createElement("li"),
					now = new Date();
					
				div.innerHTML = "";
				
				for(var i=0; i<bq.ships_building.length; i++) {
					var bqo = bq.ships_building[i],
						nUl = ul.cloneNode(false),
						nLi = li.cloneNode(false),
						ncs = (Lib.parseServerDate(bqo.date_completed).getTime() - now.getTime()) / 1000;
					
					nUl.Build = bqo;
					
					Dom.addClass(nUl, "shipQueue");
					Dom.addClass(nUl, "clearafter");

					Dom.addClass(nLi,"shipQueueType");
					nLi.innerHTML = Lib.Ships[bqo.type];
					nUl.appendChild(nLi);
					
					nLi = li.cloneNode(false);
					Dom.addClass(nLi,"shipQueueEach");
					nLi.innerHTML = Lib.formatTime(ncs);
					nUl.appendChild(nLi);

					div.appendChild(nUl);
					
					this.addQueue(ncs, this.ShipyardQueue, nUl);
				}
			}
		},
		ShipyardQueue : function(remaining, elLine){
			if(remaining <= 0) {
				elLine.parentNode.removeChild(elLine);
			}
			else {
				Sel.query("li.shipQueueEach",elLine,true).innerHTML = Lib.formatTime(Math.round(remaining));
			}
		},
		ShipPopulate : function() {
			var details = Dom.get("shipDetails");
			
			if(details) {
				var ships = this.ships.buildable,
					//ul = document.createElement("ul"),
					li = document.createElement("li"),
					shipNames = [];
					
				Event.purgeElement(details);
				details.innerHTML = "";
						
				for(var shipType in ships) {
					if(ships.hasOwnProperty(shipType)) {
						shipNames.push(shipType);
					}
				}
				shipNames.sort();
				
				for(var i=0; i<shipNames.length; i++) {
					var shipName = shipNames[i],
						ship = ships[shipName],
						nLi = li.cloneNode(false);
					/*	nUl = ul.cloneNode(false),
						nLi = li.cloneNode(false);
						
					nUl.Ship = ship;
					Dom.addClass(nUl, "shipInfo");
					Dom.addClass(nUl, "clearafter");

					Dom.addClass(nLi,"shipType");
					nLi.innerHTML = Lib.Ships[shipName];
					nUl.appendChild(nLi);

					nLi = li.cloneNode(false);
					Dom.addClass(nLi,"shipCost");
					nLi.innerHTML = [
						'<span><span><img src="',Lib.AssetUrl,'ui/s/food.png" /></span><span>',ship.cost.food,'</span></span>',
						'<span><span><img src="',Lib.AssetUrl,'ui/s/ore.png" /></span><span>',ship.cost.ore,'</span></span>',
						'<span><span><img src="',Lib.AssetUrl,'ui/s/water.png" /></span><span>',ship.cost.water,'</span></span>',
						'<span><span><img src="',Lib.AssetUrl,'ui/s/energy.png" /></span><span>',ship.cost.energy,'</span></span>',
						'<span><span><img src="',Lib.AssetUrl,'ui/s/waste.png" /></span><span>',ship.cost.waste,'</span></span>',
						'<span><span><img src="',Lib.AssetUrl,'ui/s/time.png" /></span>',Lib.formatTime(ship.cost.seconds),'</span>'
					].join('');
					nUl.appendChild(nLi);
					
					nLi = li.cloneNode(false);
					Dom.addClass(nLi,"shipAttributes");
					nLi.innerHTML = "Speed: " + ship.attributes.speed;
					nUl.appendChild(nLi);

					nLi = li.cloneNode(false);
					Dom.addClass(nLi,"shipBuild");
					if(ship.can) {
						var bbtn = document.createElement("button");
						bbtn.setAttribute("type", "button");
						bbtn.innerHTML = "Build";
						bbtn = nLi.appendChild(bbtn);
						Event.on(bbtn, "click", this.ShipBuild, {Self:this,Type:shipName,Ship:ship}, true);
					}
					nUl.appendChild(nLi);*/
					
					nLi.innerHTML = ['<div class="yui-gb" style="margin-bottom:2px;">',
					'	<div class="yui-u first" style="width:20%;background:transparent url(',Lib.AssetUrl,'star_system/field.png) no-repeat center;text-align:center;">',
					'		<img src="',Lib.AssetUrl,'ships/',shipName,'.png" style="width:100px;height:100px;" />',
					'	</div>',
					'	<div class="yui-u" style="width:67%">',
					'		<span class="buildingName">',Lib.Ships[shipName],'</span>: ',
					'		<div><label style="font-weight:bold;">Cost:</label>',
					'			<span><span><img src="',Lib.AssetUrl,'ui/s/food.png" class="smallFood" /></span><span>',ship.cost.food,'</span></span>',
					'			<span><span><img src="',Lib.AssetUrl,'ui/s/ore.png" class="smallOre" /></span><span>',ship.cost.ore,'</span></span>',
					'			<span><span><img src="',Lib.AssetUrl,'ui/s/water.png" class="smallWater" /></span><span>',ship.cost.water,'</span></span>',
					'			<span><span><img src="',Lib.AssetUrl,'ui/s/energy.png" class="smallEnergy" /></span><span>',ship.cost.energy,'</span></span>',
					'			<span><span><img src="',Lib.AssetUrl,'ui/s/waste.png" class="smallWaste" /></span><span>',ship.cost.waste,'</span></span>',
					'			<span><span><img src="',Lib.AssetUrl,'ui/s/time.png" class="smallTime" /></span>',Lib.formatTime(ship.cost.seconds),'</span>',
					'		</div>',
					'		<div><label style="font-weight:bold;">Attributes:</label>',
					'			<span><label>Speed: </label><span>',ship.attributes.speed,'</span></span>',
					'			<span><label>Hold Size: </label><span>',ship.attributes.hold_size,'</span></span>',
					'		</div>',
					'	</div>',
					'	<div class="yui-u" style="width:8%">',
					ship.can ? '		<button type="button">Build</button>' : '',
					'	</div>',
					'</div>'].join('');
					if(ship.can) {
						Event.on(Sel.query("button", nLi, true), "click", this.ShipBuild, {Self:this,Type:shipName,Ship:ship}, true);
					}
					
					details.appendChild(nLi);
					
				}
			}
		},
		ShipBuild : function() {
			Lacuna.Pulser.Show();
			
			this.Self.service.build_ship({
				session_id:Game.GetSession(),
				building_id:this.Self.building.id,
				type:this.Type,
				quantity:1
			}, {
				success : function(o){
					YAHOO.log(o, "info", "Shipyard.ShipBuild.success");
					Lacuna.Pulser.Hide();
					this.Self.fireEvent("onMapRpc", o.result);
					//this.Self.UpdateCost(this.Ship.cost);
					this.Self.ship_build_queue = o.result;
					this.Self.ShipyardDisplay();
					
					this.Self.ships.docks_available--;
					if(this.Self.ships.docks_available < 0) {
						this.Self.ships.docks_available = 0;
					}
					var sda = Dom.get("shipDocksAvailable");
					if(sda) {
						sda.innerHTML = this.Self.ships.docks_available;
					}
				},
				failure : function(o){
					YAHOO.log(o, "error", "Shipyard.ShipBuild.failure");
					Lacuna.Pulser.Hide();
					this.Self.fireEvent("onMapRpcFailed", o);
				},
				timeout:Game.Timeout,
				scope:this
			});
		}
		
	});
	
	YAHOO.lacuna.buildings.Shipyard = Shipyard;

})();
YAHOO.register("shipyard", YAHOO.lacuna.buildings.Shipyard, {version: "1", build: "0"}); 

}