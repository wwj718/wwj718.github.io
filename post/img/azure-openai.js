/**
 * Bundled by jsDelivr using Rollup v2.79.1 and Terser v5.19.2.
 * Original file: /npm/@azure/openai@1.0.0-beta.12/dist-esm/src/index.js
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
import{isTokenCredential as e}from"/npm/@azure/core-auth@1.7.2/+esm";export{AzureKeyCredential}from"/npm/@azure/core-auth@1.7.2/+esm";import{__rest as t,__asyncGenerator as n,__await as i}from"/npm/tslib@2.6.2/+esm";import{getClient as o,operationOptionsToRequestParameters as s}from"/npm/@azure-rest/core-client@1.4.0/+esm";import{createClientLogger as r}from"/npm/@azure/logger@1.1.2/+esm";import{createSseStream as a}from"/npm/@azure/core-sse@2.1.2/+esm";import{createFile as l}from"/npm/@azure/core-rest-pipeline@1.15.2/+esm";const d=r("openai");const p={"POST /deployments/{deploymentId}/audio/transcriptions":["200"],"POST /deployments/{deploymentId}/audio/translations":["200"],"POST /deployments/{deploymentId}/completions":["200"],"POST /deployments/{deploymentId}/chat/completions":["200"],"POST /deployments/{deploymentId}/images/generations":["200"],"POST /deployments/{deploymentId}/embeddings":["200"],"GET /operations/images/{operationId}":["200"],"POST /images/generations:submit":["202"],"GET /images/generations:submit":["200","202"]};function c(e){const t=e.headers["x-ms-original-url"],n=new URL(null!=t?t:e.request.url),i=e.request.method;let o=p[`${i} ${n.pathname}`];return o||(o=function(e,t){var n,i,o,s;const r=t.split("/");let a=-1,l=[];for(const[t,d]of Object.entries(p)){if(!t.startsWith(e))continue;const p=u(t),c=p.split("/");let f=!0;for(let e=c.length-1,t=r.length-1;e>=1&&t>=1;e--,t--)if((null===(n=c[e])||void 0===n?void 0:n.startsWith("{"))&&-1!==(null===(i=c[e])||void 0===i?void 0:i.indexOf("}"))){const n=c[e].indexOf("}")+1,i=null===(o=c[e])||void 0===o?void 0:o.length;if(!new RegExp(`${null===(s=c[e])||void 0===s?void 0:s.slice(n,i)}`).test(r[t]||"")){f=!1;break}}else if(c[e]!==r[t]){f=!1;break}f&&p.length>a&&(a=p.length,l=d)}return l}(i,n.pathname)),!o.includes(e.status)}function u(e){const t=e.indexOf("/");return e.slice(t)}function f(e,t,n={}){const i=function(e,t,n={}){var i,s,r,a,l,p,c,u;const f=null!==(i=n.baseUrl)&&void 0!==i?i:`${e}/openai`;n.apiVersion=null!==(s=n.apiVersion)&&void 0!==s?s:"2024-03-01-preview";const m="azsdk-js-openai-rest/1.0.0-beta.12",v=n.userAgentOptions&&n.userAgentOptions.userAgentPrefix?`${n.userAgentOptions.userAgentPrefix} ${m}`:`${m}`;return n=Object.assign(Object.assign({},n),{userAgentOptions:{userAgentPrefix:v},loggingOptions:{logger:null!==(a=null===(r=n.loggingOptions)||void 0===r?void 0:r.logger)&&void 0!==a?a:d.info},credentials:{scopes:null!==(p=null===(l=n.credentials)||void 0===l?void 0:l.scopes)&&void 0!==p?p:["https://cognitiveservices.azure.com/.default"],apiKeyHeaderName:null!==(u=null===(c=n.credentials)||void 0===c?void 0:c.apiKeyHeaderName)&&void 0!==u?u:"api-key"}}),o(f,t,n)}(e,t,n);return i}function m(e,t){try{return e()}catch(e){throw new Error(`${t}: ${e}`,{cause:e})}}function v(e){if("object"!=typeof e||!e)return e;if(Array.isArray(e))return e.map((e=>v(e)));for(const t of Object.keys(e)){const n=e[t],i=t.toLowerCase().replace(/([_][a-z])/g,(e=>e.toUpperCase().replace("_","")));i!==t&&delete e[t],e[i]="object"==typeof e[i]?v(n):n}return e}function g(e){if("object"!=typeof e||!e)return e;if(Array.isArray(e))return e.map((e=>g(e)));for(const t of Object.keys(e)){const n=e[t],i=t.replace(/([A-Z])/g,(e=>`_${e.toLowerCase()}`)).replace(/^_/,"");i!==t&&delete e[t],e[i]="object"==typeof e[i]?g(n):n}return e}function _(e){return"image_url"===e.type?function(e){return{type:e.type,image_url:{url:e.imageUrl.url,detail:e.imageUrl.detail}}}(e):e}function y(e){switch(e.role){case"user":return function(e){return{role:e.role,content:"string"==typeof e.content?e.content:e.content.map(_),name:e.name}}(e);case"assistant":return function(e){void 0===e.content&&(e.content=null);const{functionCall:n,toolCalls:i}=e,o=t(e,["functionCall","toolCalls"]);return Object.assign(Object.assign(Object.assign({},g(o)),i&&0!==i.length?{tool_calls:i}:{}),n?{function_call:n}:{})}(e);case"tool":return function(e){return{role:e.role,content:e.content,tool_call_id:e.toolCallId}}(e);default:return e}}function b(e){switch(e.type){case"azure_search":return function(e){var t,n,i,o,s,r,a;return{type:e.type,parameters:{authentication:e.authentication?h(e.authentication):e.authentication,top_n_documents:e.topNDocuments,in_scope:e.inScope,strictness:e.strictness,role_information:e.roleInformation,endpoint:e.endpoint,index_name:e.indexName,fields_mapping:e.fieldsMapping?{title_field:null===(t=e.fieldsMapping)||void 0===t?void 0:t.titleField,url_field:null===(n=e.fieldsMapping)||void 0===n?void 0:n.urlField,filepath_field:null===(i=e.fieldsMapping)||void 0===i?void 0:i.filepathField,content_fields:null===(o=e.fieldsMapping)||void 0===o?void 0:o.contentFields,content_fields_separator:null===(s=e.fieldsMapping)||void 0===s?void 0:s.contentFieldsSeparator,vector_fields:null===(r=e.fieldsMapping)||void 0===r?void 0:r.vectorFields,image_vector_fields:null===(a=e.fieldsMapping)||void 0===a?void 0:a.imageVectorFields}:void 0,query_type:e.queryType,semantic_configuration:e.semanticConfiguration,filter:e.filter,embedding_dependency:e.embeddingDependency?O(e.embeddingDependency):e.embeddingDependency}}}(e);case"azure_ml_index":return function(e){return{type:e.type,parameters:{authentication:e.authentication?h(e.authentication):e.authentication,top_n_documents:e.topNDocuments,in_scope:e.inScope,strictness:e.strictness,role_information:e.roleInformation,project_resource_id:e.projectResourceId,name:e.name,version:e.version,filter:e.filter}}}(e);case"azure_cosmos_db":return function(e){return{type:e.type,parameters:{authentication:e.authentication?h(e.authentication):e.authentication,top_n_documents:e.topNDocuments,in_scope:e.inScope,strictness:e.strictness,role_information:e.roleInformation,database_name:e.databaseName,container_name:e.containerName,index_name:e.indexName,fields_mapping:{title_field:e.fieldsMapping.titleField,url_field:e.fieldsMapping.urlField,filepath_field:e.fieldsMapping.filepathField,content_fields:e.fieldsMapping.contentFields,content_fields_separator:e.fieldsMapping.contentFieldsSeparator,vector_fields:e.fieldsMapping.vectorFields},embedding_dependency:O(e.embeddingDependency)}}}(e);case"elasticsearch":return function(e){var t,n,i,o,s,r;return{type:e.type,parameters:{authentication:e.authentication?h(e.authentication):e.authentication,top_n_documents:e.topNDocuments,in_scope:e.inScope,strictness:e.strictness,role_information:e.roleInformation,endpoint:e.endpoint,index_name:e.indexName,fields_mapping:e.fieldsMapping?{title_field:null===(t=e.fieldsMapping)||void 0===t?void 0:t.titleField,url_field:null===(n=e.fieldsMapping)||void 0===n?void 0:n.urlField,filepath_field:null===(i=e.fieldsMapping)||void 0===i?void 0:i.filepathField,content_fields:null===(o=e.fieldsMapping)||void 0===o?void 0:o.contentFields,content_fields_separator:null===(s=e.fieldsMapping)||void 0===s?void 0:s.contentFieldsSeparator,vector_fields:null===(r=e.fieldsMapping)||void 0===r?void 0:r.vectorFields}:void 0,query_type:e.queryType,embedding_dependency:e.embeddingDependency?O(e.embeddingDependency):e.embeddingDependency}}}(e);case"pinecone":return function(e){return{type:e.type,parameters:{authentication:e.authentication?h(e.authentication):e.authentication,top_n_documents:e.topNDocuments,in_scope:e.inScope,strictness:e.strictness,role_information:e.roleInformation,environment:e.environment,index_name:e.indexName,fields_mapping:{title_field:e.fieldsMapping.titleField,url_field:e.fieldsMapping.urlField,filepath_field:e.fieldsMapping.filepathField,content_fields:e.fieldsMapping.contentFields,content_fields_separator:e.fieldsMapping.contentFieldsSeparator},embedding_dependency:O(e.embeddingDependency)}}}(e);default:return e}}function h(e){switch(e.type){case"connection_string":return function(e){return{type:e.type,connection_string:e.connectionString}}(e);case"key_and_key_id":return function(e){return{type:e.type,key:e.key,key_id:e.keyId}}(e);case"encoded_api_key":return function(e){return{type:e.type,encoded_api_key:e.encodedApiKey}}(e);case"access_token":return function(e){return{type:e.type,access_token:e.accessToken}}(e);case"user_assigned_managed_identity":return function(e){return{type:e.type,managed_identity_resource_id:e.managedIdentityResourceId}}(e);default:return e}}function O(e){switch(e.type){case"endpoint":return function(e){return{type:e.type,endpoint:e.endpoint,authentication:h(e.authentication)}}(e);case"deployment_name":return function(e){return{type:e.type,deployment_name:e.deploymentName}}(e);case"model_id":return function(e){return{type:e.type,model_id:e.modelId}}(e);default:return e}}function j(e){return function(e){e[Symbol.asyncIterator]||(e[Symbol.asyncIterator]=()=>q(e));e.values||(e.values=()=>q(e))}(e),e}function q(e){return n(this,arguments,(function*(){const t=e.getReader();try{for(;;){const{value:e,done:n}=yield i(t.read());if(n)return yield i(void 0);yield yield i(e)}}finally{const e=t.cancel();t.releaseLock(),yield i(e)}}))}function S(e,t){const n=null!=t?t:function(e){return e.reduce(((e,t)=>e+t.length),0)}(e),i=new Uint8Array(n);for(let t=0,n=0;t<e.length;t++){const o=e[t];i.set(o,n),n+=o.length}return i}async function k(e){const{body:t,status:n}=await e.asBrowserStream();if("200"!==n&&void 0!==t){const e=await async function(e){const t=e.getReader(),n=[];let i=0;try{for(;;){const{value:e,done:o}=await t.read();if(o)return(new TextDecoder).decode(S(n,i));i+=e.length,n.push(e)}}finally{t.releaseLock()}}(t);throw m((()=>JSON.parse(e).error),"Error parsing response body")}if(!t)throw new Error("No stream found in response. Did you enable the stream option?");return t}async function w(e,t){const n=await k(e),i=a(n),o=new TransformStream({transform:async(e,n)=>{"[DONE]"!==e.data&&n.enqueue(t(m((()=>JSON.parse(e.data)),"Error parsing an event. See 'cause' for more details")))}});return j(i.pipeThrough(o))}async function x(e,n,i,o,r){const a=null!=r?r:"string"==typeof o?{}:null!=o?o:{},d="string"==typeof o?o:void 0,{abortSignal:p,onResponse:c,requestOptions:u,tracingOptions:f}=a,m=t(a,["abortSignal","onResponse","requestOptions","tracingOptions"]),{body:_,status:y}=await e.pathUnchecked("deployments/{deploymentName}/audio/transcriptions",n).post(Object.assign(Object.assign({},s({abortSignal:p,onResponse:c,tracingOptions:f,requestOptions:u})),{contentType:"multipart/form-data",body:Object.assign(Object.assign(Object.assign({},g(m)),{file:l(i,"placeholder.wav")}),d?{response_format:d}:{})}));if("200"!==y)throw _.error;return"verbose_json"!==d?_:v(_)}async function R(e,n,i,o,r){const a=null!=r?r:"string"==typeof o?{}:null!=o?o:{},d="string"==typeof o?o:void 0,{abortSignal:p,onResponse:c,requestOptions:u,tracingOptions:f}=a,m=t(a,["abortSignal","onResponse","requestOptions","tracingOptions"]),{body:_,status:y}=await e.pathUnchecked("deployments/{deploymentName}/audio/translations",n).post(Object.assign(Object.assign({},s({abortSignal:p,onResponse:c,tracingOptions:f,requestOptions:u})),{contentType:"multipart/form-data",body:Object.assign(Object.assign(Object.assign({},g(m)),{file:l(i,"placeholder.wav")}),d?{response_format:d}:{})}));if("200"!==y)throw _.error;return"verbose_json"!==d?_:v(_)}function M(e,t,n,i={requestOptions:{}}){return e.path("/deployments/{deploymentId}/completions",t).post(Object.assign(Object.assign({},s(i)),{body:{prompt:n.prompt,max_tokens:n.maxTokens,temperature:n.temperature,top_p:n.topP,logit_bias:n.logitBias,user:n.user,n:n.n,logprobs:n.logprobs,suffix:n.suffix,echo:n.echo,stop:n.stop,presence_penalty:n.presencePenalty,frequency_penalty:n.frequencyPenalty,best_of:n.bestOf,stream:n.stream,model:n.model}}))}function F(e){const{created:n,choices:i,prompt_filter_results:o,prompt_annotations:s}=e,r=t(e,["created","choices","prompt_filter_results","prompt_annotations"]);return Object.assign(Object.assign(Object.assign(Object.assign({},v(r)),{created:new Date(n)}),{promptFilterResults:P({prompt_filter_results:o,prompt_annotations:s})}),{choices:i.map((e=>{var{content_filter_results:n}=e,i=t(e,["content_filter_results"]);return Object.assign(Object.assign({},v(i)),n?{contentFilterResults:$(n)}:{})}))})}async function T(e,t,n,i={requestOptions:{}}){return async function(e){if(c(e))throw e.body.error;return F(e.body)}(await M(e,t,n,i))}function I(e){const{created:n,choices:i,prompt_filter_results:o,prompt_annotations:s,usage:r}=e,a=t(e,["created","choices","prompt_filter_results","prompt_annotations","usage"]);return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({},v(a)),{created:new Date(n)}),{promptFilterResults:P({prompt_filter_results:o,prompt_annotations:s})}),r?{usage:{completionTokens:r.completion_tokens,promptTokens:r.prompt_tokens,totalTokens:r.total_tokens}}:{}),{choices:i?i.map((e=>{var{content_filter_results:n}=e,i=t(e,["content_filter_results"]);return Object.assign(Object.assign({},v(i)),n?{contentFilterResults:$(n)}:{})})):[]})}async function A(e,t,n,i={requestOptions:{}}){return async function(e){if(c(e))throw e.body.error;return I(e.body)}(await z(e,t,n,i))}function z(e,n,i,o={requestOptions:{}}){const{azureExtensionOptions:r,abortSignal:a,onResponse:l,requestOptions:d,tracingOptions:p}=o,c=t(o,["azureExtensionOptions","abortSignal","onResponse","requestOptions","tracingOptions"]),u={abortSignal:a,onResponse:l,requestOptions:d,tracingOptions:p},f=Object.assign(Object.assign({},(null==r?void 0:r.extensions)?{dataSources:r.extensions}:{}),(null==r?void 0:r.enhancements)?{enhancements:r.enhancements}:{});return function(e,t,n,i={requestOptions:{}}){var o,r,a,l,d,p,c;return e.path("/deployments/{deploymentId}/chat/completions",t).post(Object.assign(Object.assign({},s(i)),{body:{model:n.model,stream:n.stream,max_tokens:n.maxTokens,temperature:n.temperature,top_p:n.topP,logit_bias:n.logitBias,user:n.user,n:n.n,stop:n.stop,presence_penalty:n.presencePenalty,frequency_penalty:n.frequencyPenalty,data_sources:void 0===n.dataSources?n.dataSources:n.dataSources.map((e=>b(e))),enhancements:n.enhancements?{grounding:(null===(o=n.enhancements)||void 0===o?void 0:o.grounding)?{enabled:null===(a=null===(r=n.enhancements)||void 0===r?void 0:r.grounding)||void 0===a?void 0:a.enabled}:void 0,ocr:(null===(l=n.enhancements)||void 0===l?void 0:l.ocr)?{enabled:null===(p=null===(d=n.enhancements)||void 0===d?void 0:d.ocr)||void 0===p?void 0:p.enabled}:void 0}:void 0,seed:n.seed,logprobs:n.logprobs,top_logprobs:n.topLogprobs,response_format:n.responseFormat?{type:null===(c=n.responseFormat)||void 0===c?void 0:c.type}:void 0,tool_choice:n.toolChoice,tools:n.tools,functions:void 0===n.functions?n.functions:n.functions.map((e=>({name:e.name,description:e.description,parameters:e.parameters}))),function_call:n.functionCall,messages:n.messages.map((e=>y(e)))}}))}(e,n,Object.assign(Object.assign({messages:i},c),f),u)}async function N(e,t,n,i={requestOptions:{}}){const o=await function(e,t,n,i={requestOptions:{}}){return e.path("/deployments/{deploymentId}/images/generations",t).post(Object.assign(Object.assign({},s(i)),{body:{model:n.model,prompt:n.prompt,n:n.n,size:n.size,response_format:n.responseFormat,quality:n.quality,style:n.style,user:n.user}}))}(e,t,n,i);return async function(e){if(c(e))throw e.body.error;return{created:new Date(e.body.created),data:e.body.data.map((e=>{var t,n,i,o,s,r,a,l,d,p,c,u,f,m,v,g,_,y,b,h,O,j,q,S,k,w,x,R,M,F,T,I,A,z,N,D,P,C,$,E,U,L,H,K,B,V,W,G,J,Z;return{url:e.url,base64Data:e.b64_json,contentFilterResults:e.content_filter_results?{sexual:(null===(t=e.content_filter_results)||void 0===t?void 0:t.sexual)?{severity:null===(i=null===(n=e.content_filter_results)||void 0===n?void 0:n.sexual)||void 0===i?void 0:i.severity,filtered:null===(s=null===(o=e.content_filter_results)||void 0===o?void 0:o.sexual)||void 0===s?void 0:s.filtered}:void 0,violence:(null===(r=e.content_filter_results)||void 0===r?void 0:r.violence)?{severity:null===(l=null===(a=e.content_filter_results)||void 0===a?void 0:a.violence)||void 0===l?void 0:l.severity,filtered:null===(p=null===(d=e.content_filter_results)||void 0===d?void 0:d.violence)||void 0===p?void 0:p.filtered}:void 0,hate:(null===(c=e.content_filter_results)||void 0===c?void 0:c.hate)?{severity:null===(f=null===(u=e.content_filter_results)||void 0===u?void 0:u.hate)||void 0===f?void 0:f.severity,filtered:null===(v=null===(m=e.content_filter_results)||void 0===m?void 0:m.hate)||void 0===v?void 0:v.filtered}:void 0,selfHarm:(null===(g=e.content_filter_results)||void 0===g?void 0:g.self_harm)?{severity:null===(y=null===(_=e.content_filter_results)||void 0===_?void 0:_.self_harm)||void 0===y?void 0:y.severity,filtered:null===(h=null===(b=e.content_filter_results)||void 0===b?void 0:b.self_harm)||void 0===h?void 0:h.filtered}:void 0}:void 0,revisedPrompt:e.revised_prompt,promptFilterResults:e.prompt_filter_results?{sexual:(null===(O=e.prompt_filter_results)||void 0===O?void 0:O.sexual)?{severity:null===(q=null===(j=e.prompt_filter_results)||void 0===j?void 0:j.sexual)||void 0===q?void 0:q.severity,filtered:null===(k=null===(S=e.prompt_filter_results)||void 0===S?void 0:S.sexual)||void 0===k?void 0:k.filtered}:void 0,violence:(null===(w=e.prompt_filter_results)||void 0===w?void 0:w.violence)?{severity:null===(R=null===(x=e.prompt_filter_results)||void 0===x?void 0:x.violence)||void 0===R?void 0:R.severity,filtered:null===(F=null===(M=e.prompt_filter_results)||void 0===M?void 0:M.violence)||void 0===F?void 0:F.filtered}:void 0,hate:(null===(T=e.prompt_filter_results)||void 0===T?void 0:T.hate)?{severity:null===(A=null===(I=e.prompt_filter_results)||void 0===I?void 0:I.hate)||void 0===A?void 0:A.severity,filtered:null===(N=null===(z=e.prompt_filter_results)||void 0===z?void 0:z.hate)||void 0===N?void 0:N.filtered}:void 0,selfHarm:(null===(D=e.prompt_filter_results)||void 0===D?void 0:D.self_harm)?{severity:null===(C=null===(P=e.prompt_filter_results)||void 0===P?void 0:P.self_harm)||void 0===C?void 0:C.severity,filtered:null===(E=null===($=e.prompt_filter_results)||void 0===$?void 0:$.self_harm)||void 0===E?void 0:E.filtered}:void 0,profanity:(null===(U=e.prompt_filter_results)||void 0===U?void 0:U.profanity)?{filtered:null===(H=null===(L=e.prompt_filter_results)||void 0===L?void 0:L.profanity)||void 0===H?void 0:H.filtered,detected:null===(B=null===(K=e.prompt_filter_results)||void 0===K?void 0:K.profanity)||void 0===B?void 0:B.detected}:void 0,jailbreak:(null===(V=e.prompt_filter_results)||void 0===V?void 0:V.jailbreak)?{filtered:null===(G=null===(W=e.prompt_filter_results)||void 0===W?void 0:W.jailbreak)||void 0===G?void 0:G.filtered,detected:null===(Z=null===(J=e.prompt_filter_results)||void 0===J?void 0:J.jailbreak)||void 0===Z?void 0:Z.detected}:void 0}:void 0}}))}}(o)}async function D(e,t,n,i={requestOptions:{}}){const o=await function(e,t,n,i={requestOptions:{}}){return e.path("/deployments/{deploymentId}/embeddings",t).post(Object.assign(Object.assign({},s(i)),{body:{user:n.user,model:n.model,input:n.input,dimensions:n.dimensions}}))}(e,t,n,i);return async function(e){if(c(e))throw e.body.error;return{data:e.body.data.map((e=>({embedding:e.embedding,index:e.index}))),usage:{promptTokens:e.body.usage.prompt_tokens,totalTokens:e.body.usage.total_tokens}}}(o)}function P({prompt_annotations:e,prompt_filter_results:n}){const i=null!=n?n:e;return null==i?void 0:i.map((e=>{var{content_filter_results:n}=e,i=t(e,["content_filter_results"]);return Object.assign(Object.assign({},v(i)),{contentFilterResults:C(n)})}))}function C(e={}){var{error:n}=e,i=t(e,["error"]);return n?function(e){var t;return{error:Object.assign(Object.assign({},e),{details:null!==(t=e.details)&&void 0!==t?t:[]})}}(n):v(i)}function $(e={}){var n,{error:i}=e,o=t(e,["error"]);return i?{error:Object.assign(Object.assign({},i),{details:null!==(n=i.details)&&void 0!==n?n:[]})}:v(o)}class E{constructor(n,i={},o={}){var s,r;let a,l,d;if(this._isAzure=!1,function(t){return e(t)||void 0!==t.key}(i))l=n,d=i,a=o,this._isAzure=!0;else{l=`https://api.openai.com/v${1}`,d=n;const{credentials:e}=i,o=t(i,["credentials"]);a=Object.assign({credentials:{apiKeyHeaderName:null!==(s=null==e?void 0:e.apiKeyHeaderName)&&void 0!==s?s:"Authorization",scopes:null==e?void 0:e.scopes}},o)}this._client=f(l,d,Object.assign(Object.assign({},a),this._isAzure?{}:{additionalPolicies:[...null!==(r=a.additionalPolicies)&&void 0!==r?r:[],{position:"perCall",policy:{name:"openAiEndpoint",sendRequest:(e,t)=>{const n=new URL(e.url),i=n.pathname.split("/");switch(i[i.length-1]){case"completions":"chat"===i[i.length-2]?n.pathname=`${i[1]}/chat/completions`:n.pathname=`${i[1]}/completions`;break;case"embeddings":n.pathname=`${i[1]}/embeddings`;break;case"generations":if("images"!==i[i.length-2])throw new Error("Unexpected path");n.pathname=`${i[1]}/images/generations`;break;case"transcriptions":n.pathname=`${i[1]}/audio/transcriptions`;break;case"translations":n.pathname=`${i[1]}/audio/translations`}return n.searchParams.delete("api-version"),e.url=n.toString(),t(e)}}}]}))}setModel(e,t){this._isAzure||(t.model=e)}async getAudioTranslation(e,t,n,i){const o=null!=i?i:"string"==typeof n?{}:null!=n?n:{},s="string"==typeof n?n:void 0;return this.setModel(e,o),void 0===s?R(this._client,e,t,o):R(this._client,e,t,s,o)}async getAudioTranscription(e,t,n,i){const o=null!=i?i:"string"==typeof n?{}:null!=n?n:{},s="string"==typeof n?n:void 0;return this.setModel(e,o),void 0===s?x(this._client,e,t,o):x(this._client,e,t,s,o)}getCompletions(e,n,i={requestOptions:{}}){this.setModel(e,i);const{abortSignal:o,onResponse:s,requestOptions:r,tracingOptions:a}=i,l=t(i,["abortSignal","onResponse","requestOptions","tracingOptions"]);return T(this._client,e,Object.assign({prompt:n},l),{abortSignal:o,onResponse:s,requestOptions:r,tracingOptions:a})}streamCompletions(e,n,i={}){return this.setModel(e,i),function(e,n,i,o={requestOptions:{}}){const{abortSignal:s,onResponse:r,requestOptions:a,tracingOptions:l}=o,d=t(o,["abortSignal","onResponse","requestOptions","tracingOptions"]);return w(M(e,n,Object.assign(Object.assign({prompt:i},d),{stream:!0}),{abortSignal:s,onResponse:r,requestOptions:a,tracingOptions:l}),F)}(this._client,e,n,i)}getChatCompletions(e,t,n={requestOptions:{}}){return this.setModel(e,n),A(this._client,e,t,n)}streamChatCompletions(e,t,n={requestOptions:{}}){return this.setModel(e,n),function(e,t,n,i={requestOptions:{}}){return w(z(e,t,n,Object.assign(Object.assign({},i),{stream:!0})),I)}(this._client,e,t,n)}getImages(e,n,i={requestOptions:{}}){this.setModel(e,i);const{abortSignal:o,onResponse:s,requestOptions:r,tracingOptions:a}=i,l=t(i,["abortSignal","onResponse","requestOptions","tracingOptions"]);return N(this._client,e,Object.assign({prompt:n},l),{abortSignal:o,onResponse:s,requestOptions:r,tracingOptions:a})}getEmbeddings(e,n,i={requestOptions:{}}){this.setModel(e,i);const{abortSignal:o,onResponse:s,requestOptions:r,tracingOptions:a}=i,l=t(i,["abortSignal","onResponse","requestOptions","tracingOptions"]);return D(this._client,e,Object.assign({input:n},l),{abortSignal:o,onResponse:s,requestOptions:r,tracingOptions:a})}}class U{constructor(e){if(!e)throw new Error("key must be a non-empty string");this._key=L(e)}get key(){return this._key}update(e){this._key=L(e)}}function L(e){return e.startsWith("Bearer ")?e:`Bearer ${e}`}export{E as OpenAIClient,U as OpenAIKeyCredential};export default null;
//# sourceMappingURL=/sm/49c86ebf50b0fb779ed38af11851dbbd84e0fc1f0d20c309808570ebed58b11b.map