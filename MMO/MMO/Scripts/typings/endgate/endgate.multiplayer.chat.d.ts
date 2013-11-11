/// <reference path="../../endgate-0.2.0.d.ts" />
declare module EndGate.Multiplayer {
    enum ChatMessageType {
        User = 0,
        System = 1,
    }
    class ChatMessage {
        public From: string;
        public Message: string;
        public Type: ChatMessageType;
        constructor(From: string, Message: string, Type: ChatMessageType);
        public PreventDefault(): void;
    }
    class ChatConnected {
        public Name: string;
        public Id: any;
        constructor(Name: string, Id: any);
    }
    class ChatHandler {
        private _document;
        private _chatContainer;
        private _chatBox;
        private _chatBoxContainer;
        private _chatBoxVisible;
        private _name;
        private _colors;
        private _systemMessageColor;
        public OnMessageReceived: EndGate.EventHandler1<ChatMessage>;
        public OnUserJoined: EndGate.EventHandler1<string>;
        constructor();
        private StopPropogation(key);
        private ShowChatBox();
        private HideChatBox();
        private AddMessage(chatMessage);
        private GetHashCode(name);
    }
    var Chat: ChatHandler;
}
