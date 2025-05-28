export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["Ai.png","background.png","Bell.png","Calendar.png","Checkcircle.png","Dots.png","Edit.png","Events.png","Expand.png","favicon.png","firebase-messaging-sw.js","Hamburger.png","Home.png","iconnggoogle.webp","Laptop.png","logonamin.png","Moon.png","Plus.png","Profile.png","Question.png","Search.png","Sun.png","Timer.png","View.png"]),
	mimeTypes: {".png":"image/png",".js":"text/javascript",".webp":"image/webp"},
	_: {
		client: {start:"_app/immutable/entry/start.suQQMoYX.js",app:"_app/immutable/entry/app.DhNgmN4v.js",imports:["_app/immutable/entry/start.suQQMoYX.js","_app/immutable/chunks/BRtj5TtV.js","_app/immutable/chunks/BzRJZXn9.js","_app/immutable/chunks/CRjAGTYJ.js","_app/immutable/entry/app.DhNgmN4v.js","_app/immutable/chunks/BzRJZXn9.js","_app/immutable/chunks/DexkCHB1.js","_app/immutable/chunks/vthok_eK.js","_app/immutable/chunks/e8VI5U1H.js","_app/immutable/chunks/BXNxYxuR.js","_app/immutable/chunks/BotH8uJD.js","_app/immutable/chunks/CQ-rNl5F.js","_app/immutable/chunks/CRjAGTYJ.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('../output/server/nodes/0.js')),
			__memo(() => import('../output/server/nodes/1.js')),
			__memo(() => import('../output/server/nodes/2.js')),
			__memo(() => import('../output/server/nodes/3.js')),
			__memo(() => import('../output/server/nodes/4.js')),
			__memo(() => import('../output/server/nodes/5.js')),
			__memo(() => import('../output/server/nodes/6.js')),
			__memo(() => import('../output/server/nodes/7.js')),
			__memo(() => import('../output/server/nodes/8.js')),
			__memo(() => import('../output/server/nodes/9.js')),
			__memo(() => import('../output/server/nodes/10.js')),
			__memo(() => import('../output/server/nodes/11.js')),
			__memo(() => import('../output/server/nodes/12.js')),
			__memo(() => import('../output/server/nodes/13.js')),
			__memo(() => import('../output/server/nodes/14.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/ai-chat",
				pattern: /^\/ai-chat\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/api/auth/session",
				pattern: /^\/api\/auth\/session\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/auth/session/_server.ts.js'))
			},
			{
				id: "/api/chats",
				pattern: /^\/api\/chats\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/chats/_server.ts.js'))
			},
			{
				id: "/api/chat",
				pattern: /^\/api\/chat\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/chat/_server.ts.js'))
			},
			{
				id: "/api/cron/send-reminders",
				pattern: /^\/api\/cron\/send-reminders\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/cron/send-reminders/_server.ts.js'))
			},
			{
				id: "/api/pase-task-nlp",
				pattern: /^\/api\/pase-task-nlp\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/pase-task-nlp/_server.ts.js'))
			},
			{
				id: "/api/v1/chat",
				pattern: /^\/api\/v1\/chat\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/v1/chat/_server.ts.js'))
			},
			{
				id: "/calendar",
				pattern: /^\/calendar\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/dashboard",
				pattern: /^\/dashboard\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/forgotpass",
				pattern: /^\/forgotpass\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/home",
				pattern: /^\/home\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 8 },
				endpoint: null
			},
			{
				id: "/settings",
				pattern: /^\/settings\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 9 },
				endpoint: null
			},
			{
				id: "/signup",
				pattern: /^\/signup\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 10 },
				endpoint: null
			},
			{
				id: "/support",
				pattern: /^\/support\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 11 },
				endpoint: null
			},
			{
				id: "/tasks",
				pattern: /^\/tasks\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 12 },
				endpoint: null
			},
			{
				id: "/workspace",
				pattern: /^\/workspace\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 13 },
				endpoint: null
			},
			{
				id: "/workspace/[boardId]",
				pattern: /^\/workspace\/([^/]+?)\/?$/,
				params: [{"name":"boardId","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 14 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
