/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/admin/support-tickets/route";
exports.ids = ["app/api/admin/support-tickets/route"];
exports.modules = {

/***/ "(rsc)/./app/api/admin/support-tickets/route.ts":
/*!************************************************!*\
  !*** ./app/api/admin/support-tickets/route.ts ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _supabase_supabase_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @supabase/supabase-js */ \"(rsc)/./node_modules/@supabase/supabase-js/dist/module/index.js\");\n\n\nasync function GET(request) {\n    try {\n        console.log('🔍 Admin support tickets API called');\n        // Use service role client to bypass RLS policies - no authentication required\n        const supabaseUrl = \"https://ewrxanqszaoqtgjhreje.supabase.co\" || 0;\n        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';\n        const supabaseAdmin = (0,_supabase_supabase_js__WEBPACK_IMPORTED_MODULE_1__.createClient)(supabaseUrl, supabaseKey);\n        // Get the search params from the URL\n        const { searchParams } = new URL(request.url);\n        const status = searchParams.get('status');\n        const search = searchParams.get('search') || '';\n        // Build the query using admin client\n        let query = supabaseAdmin.from('support_tickets').select('*').order('created_at', {\n            ascending: false\n        });\n        // Apply status filter if provided\n        if (status && status !== 'all') {\n            query = query.eq('status', status);\n        }\n        // Apply search filter if provided\n        if (search) {\n            query = query.or(`subject.ilike.%${search}%,message.ilike.%${search}%,email.ilike.%${search}%`);\n        }\n        const { data, error } = await query;\n        console.log('📡 Ticket fetch result:', {\n            hasData: !!data,\n            dataLength: data?.length || 0,\n            error: error?.message\n        });\n        if (error) {\n            console.error('❌ Error fetching support tickets:', error);\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: 'Failed to fetch support tickets'\n            }, {\n                status: 500\n            });\n        }\n        console.log('✅ Successfully fetched tickets, returning response');\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            tickets: data || []\n        });\n    } catch (error) {\n        console.error('❌ Error in support tickets API:', error);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL2FkbWluL3N1cHBvcnQtdGlja2V0cy9yb3V0ZS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7QUFBMkM7QUFFVTtBQUk5QyxlQUFlRSxJQUFJQyxPQUFnQjtJQUN4QyxJQUFJO1FBQ0ZDLFFBQVFDLEdBQUcsQ0FBQztRQUVaLDhFQUE4RTtRQUM5RSxNQUFNQyxjQUFjQywwQ0FBb0MsSUFBSSxDQUFFO1FBQzlELE1BQU1HLGNBQWNILFFBQVFDLEdBQUcsQ0FBQ0cseUJBQXlCLElBQUk7UUFDN0QsTUFBTUMsZ0JBQWdCWCxtRUFBWUEsQ0FBQ0ssYUFBYUk7UUFFaEQscUNBQXFDO1FBQ3JDLE1BQU0sRUFBRUcsWUFBWSxFQUFFLEdBQUcsSUFBSUMsSUFBSVgsUUFBUVksR0FBRztRQUM1QyxNQUFNQyxTQUFTSCxhQUFhSSxHQUFHLENBQUM7UUFDaEMsTUFBTUMsU0FBU0wsYUFBYUksR0FBRyxDQUFDLGFBQWE7UUFFN0MscUNBQXFDO1FBQ3JDLElBQUlFLFFBQVFQLGNBQ1RRLElBQUksQ0FBQyxtQkFDTEMsTUFBTSxDQUFDLEtBQ1BDLEtBQUssQ0FBQyxjQUFjO1lBQUVDLFdBQVc7UUFBTTtRQUUxQyxrQ0FBa0M7UUFDbEMsSUFBSVAsVUFBVUEsV0FBVyxPQUFPO1lBQzlCRyxRQUFRQSxNQUFNSyxFQUFFLENBQUMsVUFBVVI7UUFDN0I7UUFFQSxrQ0FBa0M7UUFDbEMsSUFBSUUsUUFBUTtZQUNWQyxRQUFRQSxNQUFNTSxFQUFFLENBQ2QsQ0FBQyxlQUFlLEVBQUVQLE9BQU8saUJBQWlCLEVBQUVBLE9BQU8sZUFBZSxFQUFFQSxPQUFPLENBQUMsQ0FBQztRQUVqRjtRQUVBLE1BQU0sRUFBRVEsSUFBSSxFQUFFQyxLQUFLLEVBQUUsR0FBRyxNQUFNUjtRQUU5QmYsUUFBUUMsR0FBRyxDQUFDLDJCQUEyQjtZQUNyQ3VCLFNBQVMsQ0FBQyxDQUFDRjtZQUNYRyxZQUFZSCxNQUFNSSxVQUFVO1lBQzVCSCxPQUFPQSxPQUFPSTtRQUNoQjtRQUVBLElBQUlKLE9BQU87WUFDVHZCLFFBQVF1QixLQUFLLENBQUMscUNBQXFDQTtZQUNuRCxPQUFPM0IscURBQVlBLENBQUNnQyxJQUFJLENBQ3RCO2dCQUFFTCxPQUFPO1lBQWtDLEdBQzNDO2dCQUFFWCxRQUFRO1lBQUk7UUFFbEI7UUFFQVosUUFBUUMsR0FBRyxDQUFDO1FBQ1osT0FBT0wscURBQVlBLENBQUNnQyxJQUFJLENBQUM7WUFBRUMsU0FBU1AsUUFBUSxFQUFFO1FBQUM7SUFDakQsRUFBRSxPQUFPQyxPQUFPO1FBQ2R2QixRQUFRdUIsS0FBSyxDQUFDLG1DQUFtQ0E7UUFDakQsT0FBTzNCLHFEQUFZQSxDQUFDZ0MsSUFBSSxDQUN0QjtZQUFFTCxPQUFPLENBQUMsdUJBQXVCLEVBQUVBLGlCQUFpQk8sUUFBUVAsTUFBTUksT0FBTyxHQUFHLGlCQUFpQjtRQUFDLEdBQzlGO1lBQUVmLFFBQVE7UUFBSTtJQUVsQjtBQUNGIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXHBhcmFkXFxPbmVEcml2ZVxcRGVza3RvcFxcU2hlZGVyYXRvclhELmdpdGh1Yi5pb1xcYXBwXFxhcGlcXGFkbWluXFxzdXBwb3J0LXRpY2tldHNcXHJvdXRlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5leHRSZXNwb25zZSB9IGZyb20gJ25leHQvc2VydmVyJztcbmltcG9ydCB7IGNyZWF0ZVJvdXRlSGFuZGxlckNsaWVudCB9IGZyb20gJ0BzdXBhYmFzZS9hdXRoLWhlbHBlcnMtbmV4dGpzJztcbmltcG9ydCB7IGNyZWF0ZUNsaWVudCB9IGZyb20gJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcyc7XG5pbXBvcnQgeyBjb29raWVzIH0gZnJvbSAnbmV4dC9oZWFkZXJzJztcbmltcG9ydCB0eXBlIHsgRGF0YWJhc2UgfSBmcm9tICcuLi8uLi8uLi8uLi9saWIvZGF0YWJhc2UudHlwZXMnO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gR0VUKHJlcXVlc3Q6IFJlcXVlc3QpIHtcbiAgdHJ5IHtcbiAgICBjb25zb2xlLmxvZygn8J+UjSBBZG1pbiBzdXBwb3J0IHRpY2tldHMgQVBJIGNhbGxlZCcpO1xuICAgIFxuICAgIC8vIFVzZSBzZXJ2aWNlIHJvbGUgY2xpZW50IHRvIGJ5cGFzcyBSTFMgcG9saWNpZXMgLSBubyBhdXRoZW50aWNhdGlvbiByZXF1aXJlZFxuICAgIGNvbnN0IHN1cGFiYXNlVXJsID0gcHJvY2Vzcy5lbnYuTkVYVF9QVUJMSUNfU1VQQUJBU0VfVVJMIHx8ICcnO1xuICAgIGNvbnN0IHN1cGFiYXNlS2V5ID0gcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9ST0xFX0tFWSB8fCAnJztcbiAgICBjb25zdCBzdXBhYmFzZUFkbWluID0gY3JlYXRlQ2xpZW50KHN1cGFiYXNlVXJsLCBzdXBhYmFzZUtleSk7XG4gICAgXG4gICAgLy8gR2V0IHRoZSBzZWFyY2ggcGFyYW1zIGZyb20gdGhlIFVSTFxuICAgIGNvbnN0IHsgc2VhcmNoUGFyYW1zIH0gPSBuZXcgVVJMKHJlcXVlc3QudXJsKTtcbiAgICBjb25zdCBzdGF0dXMgPSBzZWFyY2hQYXJhbXMuZ2V0KCdzdGF0dXMnKTtcbiAgICBjb25zdCBzZWFyY2ggPSBzZWFyY2hQYXJhbXMuZ2V0KCdzZWFyY2gnKSB8fCAnJztcblxuICAgIC8vIEJ1aWxkIHRoZSBxdWVyeSB1c2luZyBhZG1pbiBjbGllbnRcbiAgICBsZXQgcXVlcnkgPSBzdXBhYmFzZUFkbWluXG4gICAgICAuZnJvbSgnc3VwcG9ydF90aWNrZXRzJylcbiAgICAgIC5zZWxlY3QoJyonKVxuICAgICAgLm9yZGVyKCdjcmVhdGVkX2F0JywgeyBhc2NlbmRpbmc6IGZhbHNlIH0pO1xuXG4gICAgLy8gQXBwbHkgc3RhdHVzIGZpbHRlciBpZiBwcm92aWRlZFxuICAgIGlmIChzdGF0dXMgJiYgc3RhdHVzICE9PSAnYWxsJykge1xuICAgICAgcXVlcnkgPSBxdWVyeS5lcSgnc3RhdHVzJywgc3RhdHVzKTtcbiAgICB9XG5cbiAgICAvLyBBcHBseSBzZWFyY2ggZmlsdGVyIGlmIHByb3ZpZGVkXG4gICAgaWYgKHNlYXJjaCkge1xuICAgICAgcXVlcnkgPSBxdWVyeS5vcihcbiAgICAgICAgYHN1YmplY3QuaWxpa2UuJSR7c2VhcmNofSUsbWVzc2FnZS5pbGlrZS4lJHtzZWFyY2h9JSxlbWFpbC5pbGlrZS4lJHtzZWFyY2h9JWBcbiAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgcXVlcnk7XG5cbiAgICBjb25zb2xlLmxvZygn8J+ToSBUaWNrZXQgZmV0Y2ggcmVzdWx0OicsIHsgXG4gICAgICBoYXNEYXRhOiAhIWRhdGEsIFxuICAgICAgZGF0YUxlbmd0aDogZGF0YT8ubGVuZ3RoIHx8IDAsXG4gICAgICBlcnJvcjogZXJyb3I/Lm1lc3NhZ2UgXG4gICAgfSk7XG5cbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCBFcnJvciBmZXRjaGluZyBzdXBwb3J0IHRpY2tldHM6JywgZXJyb3IpO1xuICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKFxuICAgICAgICB7IGVycm9yOiAnRmFpbGVkIHRvIGZldGNoIHN1cHBvcnQgdGlja2V0cycgfSxcbiAgICAgICAgeyBzdGF0dXM6IDUwMCB9XG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKCfinIUgU3VjY2Vzc2Z1bGx5IGZldGNoZWQgdGlja2V0cywgcmV0dXJuaW5nIHJlc3BvbnNlJyk7XG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgdGlja2V0czogZGF0YSB8fCBbXSB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCfinYwgRXJyb3IgaW4gc3VwcG9ydCB0aWNrZXRzIEFQSTonLCBlcnJvcik7XG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKFxuICAgICAgeyBlcnJvcjogYEludGVybmFsIHNlcnZlciBlcnJvcjogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ31gIH0sXG4gICAgICB7IHN0YXR1czogNTAwIH1cbiAgICApO1xuICB9XG59XG4iXSwibmFtZXMiOlsiTmV4dFJlc3BvbnNlIiwiY3JlYXRlQ2xpZW50IiwiR0VUIiwicmVxdWVzdCIsImNvbnNvbGUiLCJsb2ciLCJzdXBhYmFzZVVybCIsInByb2Nlc3MiLCJlbnYiLCJORVhUX1BVQkxJQ19TVVBBQkFTRV9VUkwiLCJzdXBhYmFzZUtleSIsIlNVUEFCQVNFX1NFUlZJQ0VfUk9MRV9LRVkiLCJzdXBhYmFzZUFkbWluIiwic2VhcmNoUGFyYW1zIiwiVVJMIiwidXJsIiwic3RhdHVzIiwiZ2V0Iiwic2VhcmNoIiwicXVlcnkiLCJmcm9tIiwic2VsZWN0Iiwib3JkZXIiLCJhc2NlbmRpbmciLCJlcSIsIm9yIiwiZGF0YSIsImVycm9yIiwiaGFzRGF0YSIsImRhdGFMZW5ndGgiLCJsZW5ndGgiLCJtZXNzYWdlIiwianNvbiIsInRpY2tldHMiLCJFcnJvciJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./app/api/admin/support-tickets/route.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fadmin%2Fsupport-tickets%2Froute&page=%2Fapi%2Fadmin%2Fsupport-tickets%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fadmin%2Fsupport-tickets%2Froute.ts&appDir=C%3A%5CUsers%5Cparad%5COneDrive%5CDesktop%5CShederatorXD.github.io%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cparad%5COneDrive%5CDesktop%5CShederatorXD.github.io&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!*******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fadmin%2Fsupport-tickets%2Froute&page=%2Fapi%2Fadmin%2Fsupport-tickets%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fadmin%2Fsupport-tickets%2Froute.ts&appDir=C%3A%5CUsers%5Cparad%5COneDrive%5CDesktop%5CShederatorXD.github.io%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cparad%5COneDrive%5CDesktop%5CShederatorXD.github.io&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \*******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var C_Users_parad_OneDrive_Desktop_ShederatorXD_github_io_app_api_admin_support_tickets_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/admin/support-tickets/route.ts */ \"(rsc)/./app/api/admin/support-tickets/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/admin/support-tickets/route\",\n        pathname: \"/api/admin/support-tickets\",\n        filename: \"route\",\n        bundlePath: \"app/api/admin/support-tickets/route\"\n    },\n    resolvedPagePath: \"C:\\\\Users\\\\parad\\\\OneDrive\\\\Desktop\\\\ShederatorXD.github.io\\\\app\\\\api\\\\admin\\\\support-tickets\\\\route.ts\",\n    nextConfigOutput,\n    userland: C_Users_parad_OneDrive_Desktop_ShederatorXD_github_io_app_api_admin_support_tickets_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZhZG1pbiUyRnN1cHBvcnQtdGlja2V0cyUyRnJvdXRlJnBhZ2U9JTJGYXBpJTJGYWRtaW4lMkZzdXBwb3J0LXRpY2tldHMlMkZyb3V0ZSZhcHBQYXRocz0mcGFnZVBhdGg9cHJpdmF0ZS1uZXh0LWFwcC1kaXIlMkZhcGklMkZhZG1pbiUyRnN1cHBvcnQtdGlja2V0cyUyRnJvdXRlLnRzJmFwcERpcj1DJTNBJTVDVXNlcnMlNUNwYXJhZCU1Q09uZURyaXZlJTVDRGVza3RvcCU1Q1NoZWRlcmF0b3JYRC5naXRodWIuaW8lNUNhcHAmcGFnZUV4dGVuc2lvbnM9dHN4JnBhZ2VFeHRlbnNpb25zPXRzJnBhZ2VFeHRlbnNpb25zPWpzeCZwYWdlRXh0ZW5zaW9ucz1qcyZyb290RGlyPUMlM0ElNUNVc2VycyU1Q3BhcmFkJTVDT25lRHJpdmUlNUNEZXNrdG9wJTVDU2hlZGVyYXRvclhELmdpdGh1Yi5pbyZpc0Rldj10cnVlJnRzY29uZmlnUGF0aD10c2NvbmZpZy5qc29uJmJhc2VQYXRoPSZhc3NldFByZWZpeD0mbmV4dENvbmZpZ091dHB1dD0mcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBK0Y7QUFDdkM7QUFDcUI7QUFDdUQ7QUFDcEk7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLHlHQUFtQjtBQUMzQztBQUNBLGNBQWMsa0VBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFlBQVk7QUFDWixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsUUFBUSxzREFBc0Q7QUFDOUQ7QUFDQSxXQUFXLDRFQUFXO0FBQ3RCO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDMEY7O0FBRTFGIiwic291cmNlcyI6WyIiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwUm91dGVSb3V0ZU1vZHVsZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLW1vZHVsZXMvYXBwLXJvdXRlL21vZHVsZS5jb21waWxlZFwiO1xuaW1wb3J0IHsgUm91dGVLaW5kIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvcm91dGUta2luZFwiO1xuaW1wb3J0IHsgcGF0Y2hGZXRjaCBhcyBfcGF0Y2hGZXRjaCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2xpYi9wYXRjaC1mZXRjaFwiO1xuaW1wb3J0ICogYXMgdXNlcmxhbmQgZnJvbSBcIkM6XFxcXFVzZXJzXFxcXHBhcmFkXFxcXE9uZURyaXZlXFxcXERlc2t0b3BcXFxcU2hlZGVyYXRvclhELmdpdGh1Yi5pb1xcXFxhcHBcXFxcYXBpXFxcXGFkbWluXFxcXHN1cHBvcnQtdGlja2V0c1xcXFxyb3V0ZS50c1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJcIlxuY29uc3Qgcm91dGVNb2R1bGUgPSBuZXcgQXBwUm91dGVSb3V0ZU1vZHVsZSh7XG4gICAgZGVmaW5pdGlvbjoge1xuICAgICAgICBraW5kOiBSb3V0ZUtpbmQuQVBQX1JPVVRFLFxuICAgICAgICBwYWdlOiBcIi9hcGkvYWRtaW4vc3VwcG9ydC10aWNrZXRzL3JvdXRlXCIsXG4gICAgICAgIHBhdGhuYW1lOiBcIi9hcGkvYWRtaW4vc3VwcG9ydC10aWNrZXRzXCIsXG4gICAgICAgIGZpbGVuYW1lOiBcInJvdXRlXCIsXG4gICAgICAgIGJ1bmRsZVBhdGg6IFwiYXBwL2FwaS9hZG1pbi9zdXBwb3J0LXRpY2tldHMvcm91dGVcIlxuICAgIH0sXG4gICAgcmVzb2x2ZWRQYWdlUGF0aDogXCJDOlxcXFxVc2Vyc1xcXFxwYXJhZFxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXFNoZWRlcmF0b3JYRC5naXRodWIuaW9cXFxcYXBwXFxcXGFwaVxcXFxhZG1pblxcXFxzdXBwb3J0LXRpY2tldHNcXFxccm91dGUudHNcIixcbiAgICBuZXh0Q29uZmlnT3V0cHV0LFxuICAgIHVzZXJsYW5kXG59KTtcbi8vIFB1bGwgb3V0IHRoZSBleHBvcnRzIHRoYXQgd2UgbmVlZCB0byBleHBvc2UgZnJvbSB0aGUgbW9kdWxlLiBUaGlzIHNob3VsZFxuLy8gYmUgZWxpbWluYXRlZCB3aGVuIHdlJ3ZlIG1vdmVkIHRoZSBvdGhlciByb3V0ZXMgdG8gdGhlIG5ldyBmb3JtYXQuIFRoZXNlXG4vLyBhcmUgdXNlZCB0byBob29rIGludG8gdGhlIHJvdXRlLlxuY29uc3QgeyB3b3JrQXN5bmNTdG9yYWdlLCB3b3JrVW5pdEFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MgfSA9IHJvdXRlTW9kdWxlO1xuZnVuY3Rpb24gcGF0Y2hGZXRjaCgpIHtcbiAgICByZXR1cm4gX3BhdGNoRmV0Y2goe1xuICAgICAgICB3b3JrQXN5bmNTdG9yYWdlLFxuICAgICAgICB3b3JrVW5pdEFzeW5jU3RvcmFnZVxuICAgIH0pO1xufVxuZXhwb3J0IHsgcm91dGVNb2R1bGUsIHdvcmtBc3luY1N0b3JhZ2UsIHdvcmtVbml0QXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcywgcGF0Y2hGZXRjaCwgIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFwcC1yb3V0ZS5qcy5tYXAiXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fadmin%2Fsupport-tickets%2Froute&page=%2Fapi%2Fadmin%2Fsupport-tickets%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fadmin%2Fsupport-tickets%2Froute.ts&appDir=C%3A%5CUsers%5Cparad%5COneDrive%5CDesktop%5CShederatorXD.github.io%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cparad%5COneDrive%5CDesktop%5CShederatorXD.github.io&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(ssr)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("https");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "punycode":
/*!***************************!*\
  !*** external "punycode" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("punycode");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@supabase","vendor-chunks/tr46","vendor-chunks/whatwg-url","vendor-chunks/webidl-conversions"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fadmin%2Fsupport-tickets%2Froute&page=%2Fapi%2Fadmin%2Fsupport-tickets%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fadmin%2Fsupport-tickets%2Froute.ts&appDir=C%3A%5CUsers%5Cparad%5COneDrive%5CDesktop%5CShederatorXD.github.io%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cparad%5COneDrive%5CDesktop%5CShederatorXD.github.io&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();