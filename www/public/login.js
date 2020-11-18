YAHOO.namespace("lacuna");	

if (typeof YAHOO.lacuna.Login == "undefined" || !YAHOO.lacuna.Login) {
	
(function(){
	var Lang = YAHOO.lang,
		Util = YAHOO.util,
		Cookie = Util.Cookie,
		Dom = Util.Dom,
		Event = Util.Event,
		Lacuna = YAHOO.lacuna,
		Game = Lacuna.Game,
		Lib = Lacuna.Library;

	var Login = function() {
		this.id = "login";
		this.createEvent("onLoginSuccessful");
		
		var container = document.createElement("div");
		container.id = this.id;
		Dom.addClass(container, "hidden");
		container.innerHTML = [
		'	<div class="hd">Login</div>',
		'	<div class="bd">',
		'		<form id="loginForm" name="loginForms">',
		'			<ul>',
		'				<li><label for="loginName">Empire Name</label><input type="text" id="loginName" /></li>',
		'				<li><label>Password</label><input type="password" id="loginPass"  /></li>',
		'				<li><label for="loginRemember">Remember Empire?</label><input type="checkbox" id="loginRemember" /></li>',
		'				<li><a id="loginCreate" href="#">Create an Empire</a></li>',
		'				<li class="loginFacebook"><a href="/facebook/authorize"><img src="' + Lib.AssetUrl + 'ui/web/facebook-login-button.png" /></a></li>',
		'			</ul>',
		'		</form>',
		'	</div>',
		'	<div class="ft"></div>'
		].join('');
		document.body.insertBefore(container, document.body.firstChild);
		
		this.Dialog = new YAHOO.widget.Dialog(this.id, {
			constraintoviewport:true,
			fixedcenter:true,
			postmethod:"none",
			visible:false,
			buttons:[ { text:"Login", handler:{fn:this.handleLogin, scope:this}, isDefault:true } ],
			draggable:false,
			modal:true,
			close:false,
			width:"400px",
			underlay:false,
			zIndex:9999
		});
		this.Dialog.renderEvent.subscribe(function(){
			//get el's after rendered
			this.elName = Dom.get("loginName");
			this.elPass = Dom.get("loginPass");
			this.elCreate = Dom.get("loginCreate");
			this.elRemember = Dom.get("loginRemember");
			this.elForm = Dom.get("loginForm");
		
			Event.addListener(this.elCreate, "click", this.createEmpireClick, this, true);
			Dom.removeClass(this.id, Lib.Styles.HIDDEN);
		}, this, true);
		
		this.Dialog.cfg.queueProperty("keylisteners", [new YAHOO.util.KeyListener("loginPass", { keys:13 }, { fn:this.handleLogin, scope:this, correctScope:true } ), 
			new YAHOO.util.KeyListener("loginRemember", { keys:13 }, { fn:this.handleLogin, scope:this, correctScope:true } )
		]); 
		this.Dialog.render();
		Game.OverlayManager.register(this.Dialog);
	};
	Login.prototype = {
		handleLogin : function() {
			Lacuna.Pulser.Show();
			this.setMessage("");	
			var EmpireServ = Game.Services.Empire;
			EmpireServ.login({name:this.elName.value, password:this.elPass.value, api_key:Lib.ApiKey},{
				success : function(o){
					YAHOO.log(o, "info", "Login.handleLogin.success");
					//clear the session just in case
					Game.RemoveCookie("session");
					
					if(this.elRemember.checked) {
						var now = new Date();
						 //** REMOVE THIS!!! >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
						Cookie.remove("lacunaEmpireName");
						 //** REMOVE THIS!!! <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
						Cookie.set("lacunaEmpireName", this.elName.value, {
							domain: Game.domain,
							expires: new Date(now.setFullYear(now.getFullYear() + 1))
						});
					}
					this.elForm.reset();
					this.fireEvent("onLoginSuccessful",o);
					this.hide();
				},
				failure : function(o){
					YAHOO.log(o, "error", "Login.handleLogin.failure");
					this.setMessage(o.error.message);
					Lacuna.Pulser.Hide();
					/*if(o.error.code == 1010) {
						//haven't founded empire yet so take them to species
						this.hide();
						this.initEmpire();
						Game.OverlayManager.hideAll();
						Game.SpeciesCreator.show();
					}
					else {
						this.setMessage(o.error.message);
					}*/
				},
				timeout:Game.Timeout,
				scope:this
			});
		},
		show : function(error) {
			Game.OverlayManager.hideAll();
			this.elForm.reset();
			this.Dialog.show();
			var str = Cookie.get("lacunaEmpireName");
			if(str) {
				this.elName.value = str;
				this.elRemember.checked = true;
			}
			if(error) {
				this.setMessage(error.message);
			}
		},
		hide : function() {
			if(this.elMessage) {
				Dom.replaceClass(this.elMessage, Lib.Styles.ALERT, Lib.Styles.HIDDEN);
			}
			this.Dialog.hide();
		},
		setMessage : function(str) {
			if(!this.elMessage) {
				var d = document.createElement("div");
				d.id = "loginMessage";
				this.elCreate.parentNode.insertBefore(d, this.elCreate);
				this.elMessage = d;
			}
			Dom.replaceClass(this.elMessage, Lib.Styles.HIDDEN, Lib.Styles.ALERT);
			this.elMessage.innerHTML = str;
		},
		initEmpire : function() {
			if(!Game.EmpireCreator) {
				Game.EmpireCreator = new Lacuna.CreateEmpire(this);
				Game.EmpireCreator.subscribe("onCreateSuccessful",function(oArgs) {
					this.fireEvent("onLoginSuccessful",oArgs);
				}, this, true);
			}
		},
		createEmpireClick : function(e) {
			Event.stopEvent(e); //stop href click
			this.hide(); //hide login
			this.initEmpire();
			Game.OverlayManager.hideAll();
			Game.EmpireCreator.show();
		}
	};
	Lang.augmentProto(Login, Util.EventProvider);

	Lacuna.Login = Login;
})();
YAHOO.register("login", YAHOO.lacuna.Login, {version: "1", build: "0"}); 

}
