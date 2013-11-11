var EndGate;
(function (EndGate) {
    ///<reference path="typings/jquery/jquery.d.ts"/>
    ///<reference path="typings/signalr/signalr.d.ts"/>
    ///<reference path="typings/endgate/endgate-0.2.0.d.ts"/>
    (function (Multiplayer) {
        var ChatAdapter = (function () {
            function ChatAdapter() {
                var _this = this;
                this.Connection = $.connection.hub;
                this.Proxy = ($.connection).chat;

                var savedProxyInvoke = this.Proxy.invoke;

                this.OnMessageReceived = new eg.EventHandler1();
                this.OnUserJoined = new eg.EventHandler1();
                this.OnConnected = new eg.EventHandler1();

                (this.Proxy.invoke) = function () {
                    if ((_this.Connection).state === $.signalR.connectionState.connected) {
                        return savedProxyInvoke.apply(_this.Proxy, arguments);
                    }
                };

                (this.Connection).stateChanged(function (state) {
                    if (state.oldState === 0 && state.newState === $.signalR.connectionState.connected) {
                        (_this.Proxy).invoke("join").done(function (data) {
                            _this.OnConnected.Trigger(new ChatConnected(data.Name, data.Id));
                        }).fail(function (e, g) {
                            console.log(e, g);
                        });
                    }
                });

                this.Wire();
            }
            ChatAdapter.prototype.Wire = function () {
                var _this = this;
                this.Proxy.on("chatMessage", function (from, message, type) {
                    _this.OnMessageReceived.Trigger(new ChatMessage(from, message, type));
                });
                this.Proxy.on("chatUserJoined", function (data) {
                    _this.OnUserJoined.Trigger(data.Name);
                });
            };
            return ChatAdapter;
        })();
        Multiplayer.ChatAdapter = ChatAdapter;

        (function (ChatMessageType) {
            ChatMessageType[ChatMessageType["User"] = 0] = "User";
            ChatMessageType[ChatMessageType["System"] = 1] = "System";
        })(Multiplayer.ChatMessageType || (Multiplayer.ChatMessageType = {}));
        var ChatMessageType = Multiplayer.ChatMessageType;

        var ChatMessage = (function () {
            function ChatMessage(From, Message, Type) {
                this.From = From;
                this.Message = Message;
                this.Type = Type;
                this._Handled = false;
            }
            ChatMessage.prototype.PreventDefault = function () {
                this._Handled = true;
            };
            return ChatMessage;
        })();
        Multiplayer.ChatMessage = ChatMessage;

        var ChatConnected = (function () {
            function ChatConnected(Name, Id) {
                this.Name = Name;
                this.Id = Id;
            }
            return ChatConnected;
        })();
        Multiplayer.ChatConnected = ChatConnected;

        var ChatHandler = (function () {
            function ChatHandler() {
                var _this = this;
                this._document = $(document);
                this._chatBox = $("<input>").attr("id", "chatbox").attr("type", "input").attr("autocomplete", "off");
                this._chatBoxContainer = $("<li>");
                this._chatBoxVisible = false;
                this._colors = [
                    eg.Graphics.Color.Red.toString(),
                    eg.Graphics.Color.Orange.toString(),
                    eg.Graphics.Color.Yellow.toString(),
                    eg.Graphics.Color.Green.toString(),
                    eg.Graphics.Color.Blue.toString(),
                    eg.Graphics.Color.Purple.toString(),
                    eg.Graphics.Color.White.toString(),
                    eg.Graphics.Color.Cyan.toString()
                ];
                this._systemMessageColor = eg.Graphics.Color.Yellow.toString();
                this.OnMessageReceived = new eg.EventHandler1();
                this.OnUserJoined = new eg.EventHandler1();
                //drop the chat box in there
                this._chatContainer = $("<ul>").attr("id", "eg-chat");
                $("body").append(this._chatContainer);
                var serverAdapter = new ChatAdapter();

                serverAdapter.OnMessageReceived.Bind(function (chat) {
                    _this.AddMessage(chat);
                });

                serverAdapter.OnUserJoined.Bind(function (name) {
                    _this.OnUserJoined.Trigger(name);
                });

                serverAdapter.OnConnected.Bind(function (connected) {
                    _this._name = connected.Name;
                });

                this._chatBoxContainer.append(this._chatBox);
                this._document.keydown(function (key) {
                    switch (key.keyCode) {
                        case 13:
                            if (_this._chatBoxVisible) {
                                var message = _this._chatBox.val();
                                if (message) {
                                    _this.AddMessage(new ChatMessage(_this._name, message, ChatMessageType.User));
                                    serverAdapter.Proxy.invoke("sendMessage", message);
                                }
                                _this.HideChatBox();
                            } else {
                                _this.ShowChatBox();
                            }

                            _this.StopPropogation(key);
                            break;

                        case 84:
                            if (!_this._chatBoxVisible) {
                                _this.ShowChatBox();
                                _this.StopPropogation(key);
                            }

                            break;

                        case 27:
                            if (_this._chatBoxVisible) {
                                _this.HideChatBox();
                                _this.StopPropogation(key);
                            }
                            break;
                    }
                });
            }
            ChatHandler.prototype.StopPropogation = function (key) {
                key.preventDefault();
                key.stopPropagation();
            };

            ChatHandler.prototype.ShowChatBox = function () {
                this._chatContainer.append(this._chatBoxContainer);
                this._chatBoxContainer.show();
                this._chatBox.focus();
                this._chatBoxVisible = true;
            };

            ChatHandler.prototype.HideChatBox = function () {
                this._chatBox.val("");
                this._chatBoxContainer.remove();
                this._chatBoxVisible = false;
            };

            ChatHandler.prototype.AddMessage = function (chatMessage) {
                this.OnMessageReceived.Trigger(chatMessage);

                if (!chatMessage._Handled) {
                    if (chatMessage.Type === ChatMessageType.User) {
                        var color = this._colors[this.GetHashCode(chatMessage.From) % this._colors.length], playerName = $("<span>").text(chatMessage.From).css("color", color), message = $("<span>").append($("<div/>").text(chatMessage.Message).html().replace(/\"/g, "&quot;"));

                        if (this._chatBoxVisible) {
                            $("<li>").append(playerName).append($("<span>").text(": ")).append(message).insertBefore(this._chatBoxContainer);
                        } else {
                            this._chatContainer.append($("<li>").append(playerName).append($("<span>").text(": ")).append(message));
                        }
                    }

                    if (chatMessage.Type === ChatMessageType.System) {
                        this._chatContainer.append($("<li>").append(chatMessage.Message).css("color", this._systemMessageColor));
                    }

                    if (this._chatContainer.children.length > 100) {
                        this._chatContainer.children[0].remove();
                    }
                }
            };

            ChatHandler.prototype.GetHashCode = function (name) {
                var hash = 0, i, c, l;
                if (name.length === 0)
                    return hash;
                for (i = 0, l = name.length; i < l; i++) {
                    c = name.charCodeAt(i);
                    hash = ((hash << 5) - hash) + c;
                    hash |= 0;
                }
                return hash;
            };
            return ChatHandler;
        })();
        Multiplayer.ChatHandler = ChatHandler;

        Multiplayer.Chat = new EndGate.Multiplayer.ChatHandler();
    })(EndGate.Multiplayer || (EndGate.Multiplayer = {}));
    var Multiplayer = EndGate.Multiplayer;
})(EndGate || (EndGate = {}));
