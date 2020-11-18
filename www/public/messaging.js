YAHOO.namespace("lacuna");

if (typeof YAHOO.lacuna.Messaging == "undefined" || !YAHOO.lacuna.Messaging) {
	
(function(){
	var Lang = YAHOO.lang,
		Util = YAHOO.util,
		Dom = Util.Dom,
		Event = Util.Event,
		Pager = YAHOO.widget.Paginator,
		Sel = Util.Selector,
		Lacuna = YAHOO.lacuna,
		Game = Lacuna.Game,
		Lib = Lacuna.Library;
		
	var Messaging = function() {
		this.createEvent("onRpc");
		this.createEvent("onRpcFailed");
		this.createEvent("onShow");
		this.createEvent("onPageLoaded");
		this._buildPanel();
		this._buildAttachmentPanel();
	};
	Messaging.prototype = {
		_buildPanel : function() {
			var panelId = "messagingPanel";
			
			var panel = document.createElement("div");
			panel.id = panelId;
			panel.innerHTML = ['<div class="hd">Messaging</div>',
				'<div class="bd">',
				'	<div id="messagingTabs" class="yui-navset"><ul class="yui-nav">',
				'		<li id="messagingCreate" class="tab"><a href="#"><em>Create</em></a></li>',
				'		<li id="messagingInbox" class="tab"><a href="#"><em>Inbox</em></a></li>',
				'		<li id="messagingSent" class="tab"><a href="#"><em>Sent</em></a></li>',
				'		<li id="messagingArchive" class="tab"><a href="#"><em>Archive</em></a></li>',
				'	</ul>',
				'	<div class="yui-content">',
				'		<div id="messagingCreator" class="panelTabContainer" style="display:none">',
				'			<div class="messagingCreatorC"><label><button id="messagingCreateSend" type="button">Send</button></label><span id="messagingCreateResponse"></span></div>',
				'			<div class="messagingCreatorC"><label>To:</label><input id="messagingCreateTo" type="text" /></div>',
				'			<div class="messagingCreatorC"><label>Subject:</label><input id="messagingCreateSubject" type="text" /></div>',
				'			<div class="messagingCreatorC" id="messagingCreateBody">',
				'				<textarea id="messagingCreateText" cols="80" rows="20"></textarea>',
				'			</div>',
				'		</div>',
				'		<div id="messagingReader" class="panelTabContainer yui-gd">',
				'			<div class="yui-u first" style="height: 400px; overflow-y: auto;border-right: 1px solid gray;position:relative;" >',
				'				<div id="messagingArchiver">',
				'					<button id="messagingArchiveSelected" type="button">Archive</button>',
				'					<button id="messagingSelectAll" type="button">Select All</button>',
				'				</div>',
				'				<div id="messagingPaginator">',
				'				</div>',
				'				<ul id="messagingList"></ul>',
				'			</div>',
				'			<div id="messagingDisplay" class="yui-u">',
				'				<div id="messagingReplyC" style="display:none"><button id="messagingReply" type="button">Reply</button><button id="messagingReplyAll" type="button">Reply All</button></div>',
				'				<div><label>Received:</label><span id="messagingTimestamp"></span></div>',
				'				<div><label>From:</label><span id="messagingFrom"></span></div>',
				'				<div><label>To:</label><span id="messagingTo"></span></div>',
				'				<div><label>Subject:</label><span id="messagingSubject"></span></div>',
				'				<div id="messagingBody"></div>',
				'			</div>',
				'		</div>',
				'	</div>',
				'</div>'].join('');
			document.body.insertBefore(panel, document.body.firstChild);
			Dom.addClass(panel, "nofooter");
			
			this.messagingPanel = new YAHOO.widget.Panel(panelId, {
				constraintoviewport:true,
				visible:false,
				draggable:true,
				fixedcenter:true,
				modal:true,
				close:true,
				underlay:false,
				width:"700px",
				zIndex:9999
			});
			
			this.messagingPanel.renderEvent.subscribe(function(){
				//tabs
				this.create = Dom.get("messagingCreate");
				this.inbox = Dom.get("messagingInbox");
				this.sent = Dom.get("messagingSent");
				this.archive = Dom.get("messagingArchive");
				//list and display view
				Event.on("messagingReply", "click", this.replyMessage, this, true);
				Event.on("messagingReplyAll", "click", this.replyAllMessage, this, true);
				this.list = Dom.get("messagingList");
				this.timestamp = Dom.get("messagingTimestamp");
				this.from = Dom.get("messagingFrom");
				this.to = Dom.get("messagingTo");
				this.subject = Dom.get("messagingSubject");
				this.body = Dom.get("messagingBody");
				this.display = Dom.get("messagingDisplay");
				//archiving setup
				this.archiver = Dom.get("messagingArchiver");
				Event.on("messagingArchiveSelected", "click", this.archiveMessages, this, true);
				this.select = Dom.get("messagingSelectAll");
				Event.on(this.select, "click", this.selectAllMessages, this, true);
				//create
				this._createToSelect();
				//this.createTo = Dom.get("messagingCreateTo");
				this.createSubject = Dom.get("messagingCreateSubject");
				this.createText = Dom.get("messagingCreateText");
				this.createResponse = Dom.get("messagingCreateResponse");
				Event.on("messagingCreateSend", "click", this.sendMessage, this, true);
				//set start display
				Dom.setStyle(this.display, "visibility", "hidden");
				Event.delegate("messagingTabs", "click", this.tabClick, "li.tab", this, true);
			}, this, true);
			this.messagingPanel.hideEvent.subscribe(function(){
				this.attachmentPanel.hide();
			}, this, true);
			
			this.messagingPanel.render();
			Game.OverlayManager.register(this.messagingPanel);
		},
		_buildAttachmentPanel : function() {
			var panelId = "attachmentPanel";
			
			var panel = document.createElement("div");
			panel.id = panelId;
			panel.innerHTML = ['<div class="hd">Attachment</div>',
				'<div class="bd">',
				'	<div id="attachmentMap"></div>',
				'</div>'].join('');
			document.body.insertBefore(panel, document.body.firstChild);
			Dom.addClass(panel, "nofooter");
			
			this.attachmentPanel = new YAHOO.widget.Panel(panelId, {
				constraintoviewport:true,
				visible:false,
				draggable:true,
				fixedcenter:true,
				modal:true,
				close:true,
				underlay:false,
				width:"700px",
				zIndex:10000
			});
			this.attachmentPanel.renderEvent.subscribe(function(){
				this.map = Dom.get("attachmentMap");
			});
			this.attachmentPanel.hideEvent.subscribe(function(){
				this.map.innerHTML = "";
			});
			this.attachmentPanel.load = function(attachment) {
				this.map.innerHTML = "";
				
				this.show();

				if(attachment.map) {
					var mp = attachment.map;
					
				}
			};
			
			this.attachmentPanel.render();
			Game.OverlayManager.register(this.attachmentPanel);
			
		},
		_createToSelect : function() {
			var dataSource = new Util.XHRDataSource("/empire");
			dataSource.connMethodPost = "POST";
			dataSource.maxCacheEntries = 2;
			dataSource.responseType = YAHOO.util.XHRDataSource.TYPE_JSON;
			dataSource.responseSchema = {
				resultsList : "result.empires",
				fields : ["name","id"]
			};
			
			var oTextboxList = new YAHOO.lacuna.TextboxList("messagingCreateTo", dataSource, { //config options
				maxResultsDisplayed: 10,
				minQueryLength:3,
				multiSelect:true,
				forceSelection:true,
				formatResultLabelKey:"name",
				formatResultColumnKeys:["name"],
				useIndicator:true
			});
			oTextboxList.generateRequest = function(sQuery){				
				return Lang.JSON.stringify({
						"id": YAHOO.rpc.Service._requestId++,
						"method": "find",
						"jsonrpc": "2.0",
						"params": [
							Game.GetSession(""),
							sQuery
						]
					});
			};
			
			this.createTo = oTextboxList;
		},
		_setTab : function(el) {
			var list = this.list;
			Event.purgeElement(list, true);
			list.innerHTML = "";
			Dom.removeClass([this.create,this.inbox,this.sent,this.archive], "selected");
			Dom.addClass(el, "selected");
			if(el.id == this.create.id) {
				Dom.setStyle("messagingCreator", "display", "");
				Dom.setStyle("messagingReader", "display", "none");
			}
			else {
				this.viewingMessage = null;
				Dom.setStyle("messagingCreator", "display", "none");
				Dom.setStyle("messagingReader", "display", "");
			}
			Dom.setStyle(this.display, "visibility", "hidden");
			this.toArchive = {};
			this.toArchiveCount = 0;
		},

		tabClick : function(e, matchedEl, container) {
			var id = matchedEl.id;
			if(this.currentTab != id) {
				this.viewingMessage = null;
				this.currentTab = id;
				this.loadTab();
			}
		},
		loadTab : function(isAll) {
			switch(this.currentTab) {
				case this.create.id:
					Dom.setStyle(this.archiver,"display","none");
					this.loadCreate(isAll);
					break;
				case this.sent.id:
					Dom.setStyle(this.archiver,"display","none");
					this.loadSentMessages();
					break;
				case this.archive.id:
					Dom.setStyle(this.archiver,"display","none");
					this.loadArchiveMessages();
					break;
				default:
					Dom.setStyle(this.archiver,"display","");
					this.loadInboxMessages();
					break;
			}
		},
		
		loadCreate : function(isAll) {
			this.createResponse.innerHTML = "";
			if(this.viewingMessage) {
				if(isAll) {
					var to = [{name:this.viewingMessage.from}];
					for(var i=0; i<this.viewingMessage.recipients.length; i++) {
						var nm = this.viewingMessage.recipients[i];
						if(nm != Game.EmpireData.name) {
							to.push({name:nm});
						}
					}
					this.createTo.SelectItems(to);
				}
				else {
					this.createTo.SelectItems([{name:this.viewingMessage.from}]);
				}
				this.createSubject.value = "Re: " + this.viewingMessage.subject;
				this.createText.value = "\n\n***************\n" + this.viewingMessage.body;
			}
			else {
				this.createTo.ResetSelections();
				this.createSubject.value = "";
				this.createText.value = "";
			}
			this._setTab(this.create);
		},
		loadInboxMessages : function() {
			this._setTab(this.inbox);
			if(this.pager) {this.pager.destroy();}
			
			var InboxServ = Game.Services.Inbox,
				data = {
					session_id: Game.GetSession(""),
					options:{page_number: 1}
				};
			InboxServ.view_inbox(data, {
				success : function(o){
					this.fireEvent("onRpc", o.result);
					this.pager = new Pager({
						rowsPerPage : 25,
						totalRecords: o.result.message_count,
						containers  : 'messagingPaginator',
						template : "{PreviousPageLink} {PageLinks} {NextPageLink}",
						alwaysVisible : false

					});
					this.pager.subscribe('changeRequest',this.handleInboxPagination, this, true);
					this.pager.render();

					this.processMessages(o.result,{inbox:1});
					this.fireEvent("onPageLoaded", o);
				},
				failure : function(o){
					YAHOO.log(o, "error", "Messaging.loadInboxMessages");
					this.fireEvent("onRpcFailed", o);
				},
				timeout:Game.Timeout,
				scope:this
			});
		},
		loadSentMessages : function() {
			this._setTab(this.sent);
			if(this.pager) {this.pager.destroy();}
			
			var InboxServ = Game.Services.Inbox,
				data = {
					session_id: Game.GetSession(""),
					options:{page_number: 1}
				};
			InboxServ.view_sent(data, {
				success : function(o){
					this.fireEvent("onRpc", o.result);
					this.pager = new Pager({
						rowsPerPage : 25,
						totalRecords: o.result.message_count,
						containers  : 'messagingPaginator',
						template : "{PreviousPageLink} {PageLinks} {NextPageLink}",
						alwaysVisible : false

					});
					this.pager.subscribe('changeRequest',this.handleSentPagination, this, true);
					this.pager.render();

					this.processMessages(o.result, {sent:1});
				},
				failure : function(o){
					YAHOO.log(o, "error", "Messaging.loadSentMessages");
					this.fireEvent("onRpcFailed", o);
				},
				timeout:Game.Timeout,
				scope:this
			});
		},
		loadArchiveMessages : function() {
			this._setTab(this.archive);
			if(this.pager) {this.pager.destroy();}
			
			var InboxServ = Game.Services.Inbox,
				data = {
					session_id: Game.GetSession(""),
					options:{page_number: 1}
				};
			InboxServ.view_archived(data, {
				success : function(o){
					this.fireEvent("onRpc", o.result);
					this.pager = new Pager({
						rowsPerPage : 25,
						totalRecords: o.result.message_count,
						containers  : 'messagingPaginator',
						template : "{PreviousPageLink} {PageLinks} {NextPageLink}",
						alwaysVisible : false

					});
					this.pager.subscribe('changeRequest',this.handleArchivePagination, this, true);
					this.pager.render();

					this.processMessages(o.result,{archive:1});
				},
				failure : function(o){
					YAHOO.log(o, "error", "Messaging.loadArchiveMessages");
					this.fireEvent("onRpcFailed", o);
				},
				timeout:Game.Timeout,
				scope:this
			});
		},

		handleInboxPagination : function (newState) {
			var InboxServ = Game.Services.Inbox,
				data = {
					session_id: Game.GetSession(""),
					options:{page_number: newState.page}
				};
			InboxServ.view_inbox(data, {
				success : function(o){
					this.fireEvent("onRpc", o.result);
					this.processMessages(o.result,{inbox:1});
				},
				failure : function(o){
					YAHOO.log(o, "error", "Messaging.handleInboxPagination");
					this.fireEvent("onRpcFailed", o);
				},
				timeout:Game.Timeout,
				scope:this
			});
	 
			// Update the Paginator's state
			this.pager.setState(newState);
		},
		handleSentPagination : function (newState) {
			var InboxServ = Game.Services.Inbox,
				data = {
					session_id: Game.GetSession(""),
					options:{page_number: newState.page}
				};
			InboxServ.view_sent(data, {
				success : function(o){
					this.fireEvent("onRpc", o.result);
					this.processMessages(o.result,{sent:1});
				},
				failure : function(o){
					YAHOO.log(o, "error", "Messaging.handleSentPagination");
					this.fireEvent("onRpcFailed", o);
				},
				timeout:Game.Timeout,
				scope:this
			});
	 
			// Update the Paginator's state
			this.pager.setState(newState);
		},
		handleArchivePagination : function (newState) {
			var InboxServ = Game.Services.Inbox,
				data = {
					session_id: Game.GetSession(""),
					options:{page_number: newState.page}
				};
			InboxServ.view_archived(data, {
				success : function(o){
					this.fireEvent("onRpc", o.result);
					this.processMessages(o.result,{archive:1});
				},
				failure : function(o){
					YAHOO.log(o, "error", "Messaging.handleArchivePagination");
					this.fireEvent("onRpcFailed", o);
				},
				timeout:Game.Timeout,
				scope:this
			});
	 
			// Update the Paginator's state
			this.pager.setState(newState);
		},

		processMessages : function(results, is) {
			YAHOO.log(results, "info", "Messaging.processMessages");
			var list = this.list,
				messages = results.messages,
				li = document.createElement("li"),
				isTab = is || {};
				
			//clear list here	
			Event.purgeElement(list, true);
			list.innerHTML = "";
			
			for(var i=0; i<messages.length; i++) {
				var msg = messages[i],
					nLi = li.cloneNode(false);
				msg.is = isTab;
				nLi.Message = msg;
				Dom.addClass(nLi, "message");
				if(msg.has_read == "0") {
					Dom.addClass(nLi, "unread");
				}
				nLi.innerHTML = [
					isTab.inbox ? '	<div class="messageSelect"><input type="checkbox" /></div>' : '',
					'	<div class="messageContainer">',
					'		<div class="messageDate">',Lib.formatServerDate(msg.date),'</div>',
					'		<div class="messageFrom">',
					isTab.sent ? msg.to : msg.from,
					'		</div>',
					'		<div class="messageSubject">',msg.subject,'</div>',
					//'		<div class="messageExcerpt">',msg.body_preview,'</div>',
					'	</div>'
					].join('');
				list.appendChild(nLi);
			}
			
			Event.delegate(list, "click", this.loadMessage, "div.messageContainer", this, true);
			Event.delegate(list, "click", this.checkSelect, "input[type=checkbox]", this, true);
		},
		
		checkSelect : function(e, matchedEl, container) {
			var msg = matchedEl.parentNode.parentNode.Message;
			if(msg) {
				if(matchedEl.checked) {
					this.toArchive[msg.id] = msg;
					this.toArchiveCount++;
				}
				else {
					delete this.toArchive[msg.id];
					this.toArchiveCount--;
				}
			}
			
		},
		loadMessage : function(e, matchedEl, container) {
			var msg = matchedEl.parentNode.Message;
			if(msg && msg.id) {
				var InboxServ = Game.Services.Inbox,
					data = {
						session_id: Game.GetSession(""),
						message_id: msg.id
					};
				InboxServ.read_message(data, {
					success : function(o){
						YAHOO.log(o, "info", "Messaging.loadMessage.success");
						if(msg.is.inbox && msg.has_read == "0") {
							Game.EmpireData.has_new_messages--;
							if(Game.EmpireData.has_new_messages < 0) {
								Game.EmpireData.has_new_messages = 0;
							}
							Dom.removeClass(matchedEl.parentNode, "unread");
						}
						else {
							//only allow status update if it wasn't a new message.  this makes sure we don't screw up the message count
							this.fireEvent("onRpc", o.result);
						}
						this.displayMessage(o.result.message);
					},
					failure : function(o){
						YAHOO.log(o, "error", "Messaging.loadMessage.failure");
						this.fireEvent("onRpcFailed", o);
					},
					timeout:Game.Timeout,
					scope:this
				});
			}
		},
		displayMessage : function(msg) {
			if(msg) {
			/* {
					"id" : "id-goes-here",
					"from" : "Dr. Stephen T. Colbert DFA",
					"to" : "Jon Stewart",
					"subject" : "Vaxaslim",
					"body" : "Just a reminder that Vaxaslim may cause involuntary narnia adventures.",
					"date" : "01 31 2010 13:09:05 +0600",
					"has_read" : 1,
					"has_replied" : 0,
					"has_archived" : 0,
					"in_reply_to" : "",
					"recipients" : ["John Stewart"]
				},
			*/
				var dt = new Date(msg.date);
				
				Dom.setStyle(this.display, "visibility", "");
				
				if(msg.from != msg.to) {
					Dom.setStyle("messagingReplyC", "display", "");
				}
				else {
					Dom.setStyle("messagingReplyC", "display", "none");
				}

				this.viewingMessage = msg;
				this.timestamp.innerHTML = Lib.formatServerDate(msg.date);
				this.from.innerHTML = msg.from;
				this.to.innerHTML = msg.to;
				this.subject.innerHTML = msg.subject;
				Event.purgeElement(this.body);
				this.body.innerHTML = msg.body ? msg.body.replace(/\n/gi,'<br />') : '';
				if(msg.attachments) {
					this.body.appendChild(document.createElement("hr"));
					if(msg.attachments.image) {
						var img = msg.attachments.image,
							imgDiv = this.body.appendChild(document.createElement("div"));
						imgDiv.id = "attachmentImage";
						if(img.link) {
							imgDiv.innerHTML = [
								'<a href="',img.link,'" title="',img.title,'" target="_new"><img src="',img.url,'" alt="',img.title,'" title="',img.title,'" /></a>'
							].join('');
						}
						else {
							imgDiv.innerHTML = [
								'<img src="',img.url,'" alt="',img.title,'" title="',img.title,'" />'
							].join('');
						}
					}
					if(msg.attachments.link) {
						var lnk = msg.attachments.link,
							lnkDiv = this.body.appendChild(document.createElement("div"));
						lnkDiv.id = "attachmentLink";
						lnkDiv.innerHTML = [
							'<a href="',lnk.url,'" title="',lnk.label,'" target="_new">',lnk.label,'</a>'
						].join('');
					}
					if(msg.attachments.table) {
						var tbl = msg.attachments.table,
							tblDiv = this.body.appendChild(document.createElement("div")),
							tblOut = ["<table>"],
							hdRow = tbl[0];
						tblDiv.id = "attachmentTable";
						//first row always headers
						tblOut.push("<thead><tr>");
						for(var c=0; c<hdRow.length; c++) {
							tblOut.push("<th>");
							tblOut.push(hdRow[c]);
							tblOut.push("</th>");
						}
						tblOut.push("</tr></thead><tbody>");
						
						for(var i=1; i<tbl.length; i++) {
							var row = tbl[i];
							tblOut.push("<tr>");
							for(var d=0; d<row.length; d++) {
								tblOut.push("<td>");
								tblOut.push(row[d]);
								tblOut.push("</td>");
							}
							tblOut.push("</tr>");
						}
						tblOut.push("</tbody></table>");
							
						tblDiv.innerHTML = tblOut.join('');
					}
					if(msg.attachments.map) {
						this.body.appendChild(document.createElement('br'));
						var va = document.createElement("button");
						va.setAttribute("type", "button");
						va.innerHTML = "No Map Attachment Yet";
						va = this.body.appendChild(va);
						Event.on(va, "click", this.displayAttachment, this, true);
					}
				}
			}
		},
		displayAttachment : function() {
			this.attachmentPanel.load(this.viewingMessage.attachments);
		},
		sendMessage : function() {
			var to = this.createTo.Selections();
			if(to.length == 0) {
				this.createResponse.innerHTML = "Must send a message To someone.";
			}
			else {
				var InboxServ = Game.Services.Inbox,
					data = {
						session_id: Game.GetSession(""),
						recipients: to.join(','),
						subject: this.createSubject.value,
						body: this.createText.value
					};
				
				if(this.viewingMessage) {
					data.options = {
						in_reply_to:this.viewingMessage.id
					};
				}
				
				InboxServ.send_message(data, {
					success : function(o){
						YAHOO.log(o, "info", "Messaging.sendMessage.success");
						this.fireEvent("onRpc", o.result);
						var u = o.result.message.unknown;
						if(u && u.length > 0) {
							this.createResponse.innerHTML = "Unable to send to: " + u.join(', ');						
						}
						else {
							this.createResponse.innerHTML = "";	
							this.createTo.ResetSelections();
							this.createSubject.value = "";
							this.createText.value = "";
							this.currentTab = this.inbox.id;
							this.loadTab();
						}
					},
					failure : function(o){
						YAHOO.log(o, "error", "Messaging.sendMessage.failure");
						if(o.error.code == 1005) {
							this.createResponse.innerHTML = o.error.message;
						}
						else {
							this.fireEvent("onRpcFailed", o);
						}
					},
					timeout:Game.Timeout,
					scope:this
				});
			}
		},
		replyMessage : function(e) {
			this.currentTab = this.create.id;
			this.loadTab();
		},
		replyAllMessage : function(e) {
			this.currentTab = this.create.id;
			this.loadTab(true);
		},
		archiveMessages : function() {
			if(this.toArchiveCount > 0) {
				var mIds = [];
				for(var key in this.toArchive) {
					if(this.toArchive.hasOwnProperty(key)) {
						mIds.push(key);
					}
				}
				var InboxServ = Game.Services.Inbox,
					data = {
						session_id: Game.GetSession(""),
						message_ids: mIds
					};
				InboxServ.archive_messages(data, {
					success : function(o){
						YAHOO.log(o, "info", "Messaging.archiveMessages.success");
						//this.fireEvent("onRpc", o.result); //don't do this or it will update our message count again.  Eventual Consistency
						this.archiveProcess(o.result);
					},
					failure : function(o){
						YAHOO.log(o, "error", "Messaging.archiveMessages.failure");
						this.fireEvent("onRpcFailed", o);
					},
					timeout:Game.Timeout,
					scope:this
				});
			}
		},
		archiveProcess : function(results) {
			Dom.batch(Sel.query("li.message", this.list), function(el){
				if(results.success.indexOf(el.Message.id) >= 0) {
					delete this.toArchive[el.Message.id];
					Game.EmpireData.has_new_messages--;
					if(Game.EmpireData.has_new_messages < 0) {
						Game.EmpireData.has_new_messages = 0;
					}
					this.toArchiveCount--;
					Event.purgeElement(el);
					el.parentNode.removeChild(el);
				}
			}, this, true);
			
			Dom.setStyle(this.display, "visibility", "hidden");
			delete this.selectedAll;
			this.select.innerHTML = "Select All";
		},
		selectAllMessages : function() {
			var els = Sel.query("input[type=checkbox]",this.list);
			Dom.batch(els, function(el) {
				el.checked = !this.selectedAll;
				this.checkSelect(null,el);
			}, this, true);
			if(this.selectedAll) {
				delete this.selectedAll;
				this.select.innerHTML = "Select All";
			}
			else {
				this.selectedAll = 1;
				this.select.innerHTML = "Select None";
			}
		},
		
		isVisible : function() {
			return this.messagingPanel.cfg.getProperty("visible");
		},
		show : function() {
			Game.OverlayManager.hideAll();
			this.messagingPanel.show();
			this.currentTab = this.inbox.id;
			this.loadTab();
			this.fireEvent("onShow");
		},
		showMessage : function(msg) {
			Game.OverlayManager.hideAll();
			this.messagingPanel.show();
			var InboxServ = Game.Services.Inbox,
				data = {
					session_id: Game.GetSession(""),
					message_id: msg
				};
			InboxServ.read_message(data, {
				success : function(o){
					YAHOO.log(o, "info", "Messaging.showMessage.success");
					var message = o.result.message;
					if (message.has_archived != "0") {
						this.currentTab = this.archive.id;
					}
					else {
						this.currentTab = this.inbox.id;
					}
					this.loadTab();
					var showMessageOnce;
					showMessageOnce = function(o) {
						this.displayMessage(message);
						this.unsubscribe("onPageLoaded", showMessageOnce);
					};
					this.subscribe("onPageLoaded", showMessageOnce, this, true);
				},
				failure : function(o){
					YAHOO.log(o, "error", "Messaging.loadMessage.failure");
					this.fireEvent("onRpcFailed", o);
				},
				timeout:Game.Timeout,
				scope:this
			});
		},
		hide : function() {
			this.messagingPanel.hide();
		}
	};
	Lang.augmentProto(Messaging, Util.EventProvider);
			
	Lacuna.Messaging = new Messaging();
})();
YAHOO.register("messaging", YAHOO.lacuna.Messaging, {version: "1", build: "0"}); 

}
