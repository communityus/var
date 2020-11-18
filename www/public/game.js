YAHOO.namespace("lacuna");

if (typeof YAHOO.lacuna.Game == "undefined" || !YAHOO.lacuna.Game) {
	
(function(){
	var Util = YAHOO.util,
		Lang = YAHOO.lang,
		Cookie = Util.Cookie,
		Dom = Util.Dom,
		Event = Util.Event,
		Lacuna = YAHOO.lacuna;
		
	var Game = {
		AssetUrl : "http://localhost/lacuna/assets/",
		EmpireData : {
			current_planet_id:null,
			essentia:null,
			happiness:null,
			has_new_messages:null,
			id:null,
			name:null,
			planets:{}
		},
		Styles : {
			HIDDEN : "hidden"
		},
		Services : {
			Empire : new YAHOO.rpc.Service(YAHOO.lacuna.SMD.Empire),
			Maps : new YAHOO.rpc.Service(YAHOO.lacuna.SMD.Map)
		},
		ErrorCodes : {
			1000 : "Name not available",
			1001 : "Invalid password",
			1002 : "Object does not exist",
			1003 : "Too much information",
			1004 : "Password incorrect",
			1005 : "Contains invalid characters",
			1006 : "Authorization denied",
			1007 : "Overspend",
			1008 : "Underspend",
			1009 : "Invalid range"
		},
		
		Start : function() {	
			var session = Cookie.getSub("lacuna","session");
			if(!session) {
				Lacuna.Game.LoginDialog = new Lacuna.Login();
				Lacuna.Game.LoginDialog.subscribe("onLoginSuccessful",function(oArgs){
					Lacuna.Game.Setup(oArgs.result);
				});
				Lacuna.Game.LoginDialog.show();
			}
			else {
				//Run rest of UI since we're logged in
				Lacuna.Game.Run();
			}
		},
		Setup : function(result) {
			var now = new Date();
			//remember session
			Cookie.setSub("lacuna", "session", result.session_id, {
				domain: "lacunaexpanse.com",
				expires: now.setHours(now.getHours() + 1)
			});

			//store empire data
			Lacuna.Game.ProcessStatus(result.status);
			//Run rest of UI now that we're logged in
			Lacuna.Game.Run();
		},
		Run : function() {
			Lacuna.StarMap.subscribe("onMapLoaded", function(oArgs){
				Lacuna.Game.ProcessStatus(oArgs.status);
				Lacuna.Menu.create();
			});
			Lacuna.StarMap.Load();
		},
		ProcessStatus : function(status) {
			if(status && status.empire) {
				var now = new Date();
				//remember current planet
				Cookie.setSub("lacuna", "currentPlanetId", status.empire.current_planet_id, {
					domain: "lacunaexpanse.com",
					expires: now.setHours(now.getHours() + 1)
				});
			
				Lacuna.Game.EmpireData = status.empire;
				Lacuna.Menu.update();
			}
		},
		
		Logout : function() {
			var EmpireServ = Lacuna.Game.Services.Empire,
				session = Cookie.getSub("lacuna","session");
				
			EmpireServ.logout({session_id:session},{
				success : function(o){
					console.log(o);
			
					Cookie.remove("lacuna",{
						domain: "lacunaexpanse.com"
					});
					
					document.getElementById("content").innerHTML = "";
					if(!Lacuna.Game.LoginDialog) {
						Lacuna.Game.LoginDialog = new Lacuna.Login();
					}
					Lacuna.Game.LoginDialog.show();
					Lacuna.Menu.hide();
				},
				failure : function(o){
					console.log("LOGOUT FAILED: ", o);
				},
				timeout:5000
			});
		}
	};
	
	YAHOO.lacuna.Game = Game;
})();
YAHOO.register("game", YAHOO.lacuna.Game, {version: "1", build: "0"}); 

}