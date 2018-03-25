/*!
 * pixi-lights - v2.0.0
 * Compiled Sun, 25 Mar 2018 01:58:49 UTC
 *
 * pixi-lights is licensed under the MIT License.
 * http://www.opensource.org/licenses/mit-license
 */
PIXI.Circle.prototype.getMesh=function(t,e,r){void 0===t&&(t=40),e=e||new Float32Array(2*(t+1)),r=r||new Uint16Array(t+1);var i=2*Math.PI/t,o=-1;r[++o]=o;for(var n=0;n<=t;++n){var a=2*n,s=i*n;e[a]=Math.cos(s)*this.radius,e[a+1]=Math.sin(s)*this.radius,r[++o]=o}return r[o]=1,{vertices:e,indices:r}};var plugins={},diffuseGroup=new PIXI.display.Group,normalGroup=new PIXI.display.Group,lightGroup=new PIXI.display.Group;function registerPlugin(t,e){plugins[t]=e}diffuseGroup.useRenderTexture=!0,normalGroup.useRenderTexture=!0;var Light=function(t){function e(e,r,i,o){t.call(this),this.vertices=i||new Float32Array(8),this.indices=o||new Uint16Array([0,1,2,0,2,3]),this.blendMode=PIXI.BLEND_MODES.ADD,this.drawMode=PIXI.DRAW_MODES.TRIANGLES,this.dirty=0,this.lightHeight=.075,this.falloff=[.75,3,20],this.shaderName=null,this.useViewportQuad=!0,this._color=5066073,this._colorRgba=[.3,.3,.35,.8],(e||0===e)&&(this.color=e),(r||0===r)&&(this.brightness=r),this.parentGroup=lightGroup,this._glDatas={},this.shaderName="lights"}t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e;var r={color:{configurable:!0},brightness:{configurable:!0}};return r.color.get=function(){return this._color},r.color.set=function(t){this._color=t,PIXI.utils.hex2rgb(t,this._colorRgba)},r.brightness.get=function(){return this._colorRgba[3]},r.brightness.set=function(t){this._colorRgba[3]=t},e.prototype.syncShader=function(t){t.uniforms.uUseViewportQuad=this.useViewportQuad;var e=t.uniforms.uLightColor;e&&(e[0]=this._colorRgba[0],e[1]=this._colorRgba[1],e[2]=this._colorRgba[2],e[3]=this._colorRgba[3],t.uniforms.uLightColor=e),t.uniforms.uLightHeight=this.lightHeight;var r=t.uniforms.uLightFalloff;r&&(r[0]=this.falloff[0],r[1]=this.falloff[1],r[2]=this.falloff[2],t.uniforms.uLightFalloff=r)},e.prototype._renderWebGL=function(t){t.setObjectRenderer(t.plugins.lights),t.plugins.lights.render(this)},Object.defineProperties(e.prototype,r),e}(PIXI.Container),vertex="attribute vec2 aVertexPosition;\n\nuniform bool uUseViewportQuad;\nuniform mat3 translationMatrix;\nuniform mat3 projectionMatrix;\n\nvoid main(void) {\n    if (uUseViewportQuad) {\n        gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n    }\n    else\n    {\n        gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n    }\n}\n",LightShader=function(t){function e(r,i,o,n,a){var s={translationMatrix:{type:"mat3",value:new Float32Array(9)},projectionMatrix:{type:"mat3",value:new Float32Array(9)},uSampler:{type:"sampler2D",value:null},uNormalSampler:{type:"sampler2D",value:null},uUseViewportQuad:{type:"bool",value:!0},uViewSize:{type:"2f",value:new Float32Array(2)},uLightColor:{type:"4f",value:new Float32Array([1,1,1,1])},uLightFalloff:{type:"3f",value:new Float32Array([0,0,0])},uLightHeight:{type:"1f",value:.075}};if(n)for(var l in n)s[l]=n[l];var u={aVertexPosition:0};if(a)for(var h in a)u[h]=a[h];t.call(this,r,i||e.defaultVertexSrc,o,u)}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e}(PIXI.Shader);LightShader.defaultVertexSrc=vertex;var AmbientLight=function(t){function e(e,r){void 0===e&&(e=16777215),void 0===r&&(r=.5),t.call(this,e,r),this.shaderName="ambientLightShader"}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e}(Light),commonUniforms="uniform sampler2D uSampler;\nuniform sampler2D uNormalSampler;\n\nuniform mat3 translationMatrix;\n\nuniform vec2 uViewSize;     // size of the viewport\n\nuniform vec4 uLightColor;   // light color, alpha channel used for intensity.\nuniform vec3 uLightFalloff; // light attenuation coefficients (constant, linear, quadratic)\nuniform float uLightHeight; // light height above the viewport\n",computeVertexPosition="vec2 texCoord = gl_FragCoord.xy / uViewSize;\ntexCoord.y = 1.0 - texCoord.y; // FBOs positions are flipped.\n",loadNormals="vec4 normalColor = texture2D(uNormalSampler, texCoord);\nnormalColor.g = 1.0 - normalColor.g; // Green layer is flipped Y coords.\n\n// bail out early when normal has no data\nif (normalColor.a == 0.0) discard;\n",fragment="precision highp float;\n\n"+commonUniforms+"\n\nvoid main(void)\n{\n"+computeVertexPosition+"\n"+loadNormals+'\n\n    // simplified lambert shading that makes assumptions for ambient color\n\n    // compute Distance\n    float D = 1.0;\n\n    // normalize vectors\n    vec3 N = normalize(normalColor.xyz * 2.0 - 1.0);\n    vec3 L = vec3(1.0, 1.0, 1.0);\n\n    // pre-multiply light color with intensity\n    // then perform "N dot L" to determine our diffuse\n    vec3 diffuse = (uLightColor.rgb * uLightColor.a) * max(dot(N, L), 0.0);\n\n    vec4 diffuseColor = texture2D(uSampler, texCoord);\n    vec3 finalColor = diffuseColor.rgb * diffuse;\n\n    gl_FragColor = vec4(finalColor, diffuseColor.a);\n}\n',AmbientLightShader=function(t){function e(e){t.call(this,e,null,fragment)}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e}(LightShader);registerPlugin("ambientLightShader",AmbientLightShader);var PointLight=function(t){function e(e,r,i){if(void 0===e&&(e=16777215),void 0===r&&(r=1),void 0===i&&(i=1/0),i!==1/0){var o=new PIXI.Circle(0,0,i).getMesh(),n=o.vertices,a=o.indices;t.call(this,e,r,n,a),this.useViewportQuad=!1,this.drawMode=PIXI.DRAW_MODES.TRIANGLE_FAN}else t.call(this,e,r);this.radius=i,this.shaderName="pointLightShader"}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype.syncShader=function(e){t.prototype.syncShader.call(this,e),e.uniforms.uLightRadius=this.radius},e}(Light),computeDiffuse='// normalize vectors\nvec3 N = normalize(normalColor.xyz * 2.0 - 1.0);\nvec3 L = normalize(lightVector);\n\n// pre-multiply light color with intensity\n// then perform "N dot L" to determine our diffuse\nvec3 diffuse = (uLightColor.rgb * uLightColor.a) * max(dot(N, L), 0.0);\n',combine="// calculate final intesity and color, then combine\nvec3 intensity = diffuse * attenuation;\nvec4 diffuseColor = texture2D(uSampler, texCoord);\nvec3 finalColor = diffuseColor.rgb * intensity;\n\ngl_FragColor = vec4(finalColor, diffuseColor.a);\n",fragment$1="precision highp float;\n\n// imports the common uniforms like samplers, and ambient color\n"+commonUniforms+"\n\nuniform float uLightRadius;\n\nvoid main()\n{\n"+computeVertexPosition+"\n"+loadNormals+"\n\n    vec2 lightPosition = translationMatrix[2].xy / uViewSize;\n\n    // the directional vector of the light\n    vec3 lightVector = vec3(lightPosition - texCoord, uLightHeight);\n\n    // correct for aspect ratio\n    lightVector.x *= uViewSize.x / uViewSize.y;\n\n    // compute Distance\n    float D = length(lightVector);\n\n    // bail out early when pixel outside of light sphere\n    if (D > uLightRadius) discard;\n\n"+computeDiffuse+"\n\n    // calculate attenuation\n    float attenuation = 1.0 / (uLightFalloff.x + (uLightFalloff.y * D) + (uLightFalloff.z * D * D));\n\n"+combine+"\n}\n",PointLightShader=function(t){function e(e){t.call(this,e,null,fragment$1,{uLightRadius:{type:"1f",value:1}})}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e}(LightShader);registerPlugin("pointLightShader",PointLightShader);var DirectionalLight=function(t){function e(e,r,i){void 0===e&&(e=16777215),void 0===r&&(r=1),t.call(this,e,r),this.target=i,this._directionVector=new PIXI.Point,this.shaderName="directionalLightShader"}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype.updateTransform=function(){this.containerUpdateTransform();var t=this._directionVector,e=this.worldTransform,r=this.target.worldTransform?this.target.worldTransform.tx:this.target.x,i=this.target.worldTransform?this.target.worldTransform.ty:this.target.y;t.x=e.tx-r,t.y=e.ty-i;var o=Math.sqrt(t.x*t.x+t.y*t.y);t.x/=o,t.y/=o},e.prototype.syncShader=function(e){t.prototype.syncShader.call(this,e);var r=e.uniforms.uLightDirection;r[0]=this._directionVector.x,r[1]=this._directionVector.y,e.uniforms.uLightDirection=r},e}(Light),fragment$2="precision highp float;\n\n// imports the common uniforms like samplers, and ambient/light color\n"+commonUniforms+"\n\nuniform vec2 uLightDirection;\n\nvoid main()\n{\n"+computeVertexPosition+"\n"+loadNormals+"\n\n    // the directional vector of the light\n    vec3 lightVector = vec3(uLightDirection, uLightHeight);\n\n    // compute Distance\n    float D = length(lightVector);\n\n"+computeDiffuse+"\n\n    // calculate attenuation\n    float attenuation = 1.0;\n\n"+combine+"\n}\n",DirectionalLightShader=function(t){function e(e){t.call(this,e,null,fragment$2,{uLightDirection:{type:"2f",value:new Float32Array(2)}})}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e}(LightShader);registerPlugin("directionalLightShader",DirectionalLightShader);var LightRenderer=function(t){function e(r){t.call(this,r);var i=6*e.MAX_LIGHTS;this.indices=new Uint16Array(i);for(var o=0,n=0;o<i;o+=6,n+=4)this.indices[o+0]=n+0,this.indices[o+1]=n+1,this.indices[o+2]=n+2,this.indices[o+3]=n+0,this.indices[o+4]=n+2,this.indices[o+5]=n+3;this.shaders={},this.lights=[]}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e.prototype.onContextChange=function(){for(var t in this.gl=this.renderer.gl,plugins)this.shaders[t]=new plugins[t](this.gl)},e.prototype.render=function(t){var e=this.renderer,r=e.gl;this.lights.push(t);var i=t._glDatas[e.CONTEXT_UID];i||(e.bindVao(null),(i={shader:this.shaders[t.shaderName],vertexBuffer:PIXI.glCore.GLBuffer.createVertexBuffer(r,t.vertices,r.STREAM_DRAW),indexBuffer:PIXI.glCore.GLBuffer.createIndexBuffer(r,t.indices,r.STATIC_DRAW),vao:null,dirty:t.dirty}).vao=new PIXI.glCore.VertexArrayObject(r).addIndex(i.indexBuffer).addAttribute(i.vertexBuffer,i.shader.attributes.aVertexPosition,r.FLOAT,!1,8,0),t._glDatas[e.CONTEXT_UID]=i),e.bindVao(i.vao),t.useViewportQuad&&(t.vertices[2]=t.vertices[4]=e.screen.width,t.vertices[5]=t.vertices[7]=e.screen.height),i.vertexBuffer.upload(t.vertices),i.dirty!==t.dirty&&(i.dirty=t.dirty,i.indexBuffer.upload(t.indices))},e.prototype.flush=function(){for(var t=null,e=null,r=null,i=null,o=this.renderer,n=0;n<this.lights.length;++n){var a=this.lights[n],s=this.lights[n]._activeParentLayer;if(s){if(r!==s){r=s;var l=s._activeStageParent;if(s.diffuseTexture&&s.normalTexture)t=s.diffuseTexture,e=s.normalTexture;else for(var u=0;u<l._activeLayers.length;u++){var h=l._activeLayers[u];h.group===normalGroup&&(e=h.getRenderTexture()),h.group===diffuseGroup&&(t=h.getRenderTexture())}o.bindTexture(t,0,!0),o.bindTexture(e,1,!0)}var c=a._glDatas[o.CONTEXT_UID],f=c.shader;if(i!==f){i=f,o.bindShader(f),f.uniforms.uSampler=0,f.uniforms.uNormalSampler=1;var d=f.uniforms.uViewSize;d[0]=o.screen.width,d[1]=o.screen.height,f.uniforms.uViewSize=d}o.bindVao(c.vao),a.syncShader(f),o.state.setBlendMode(a.blendMode),f.uniforms.translationMatrix=a.worldTransform.toArray(!0),c.vao.draw(a.drawMode,a.indices.length,0)}}this.lights.length=0},e.prototype.stop=function(){this.flush()},e}(PIXI.ObjectRenderer);LightRenderer.MAX_LIGHTS=500,PIXI.WebGLRenderer.registerPlugin("lights",LightRenderer);var vertex$1="attribute vec2 aVertexPosition;\nuniform mat3 projectionMatrix;\n\nvoid main(void) {\n    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n}",fragment$3="void main() {\n    gl_FragColor = vec4(0, 0, 0, 1);\n}",WireframeShader=function(t){function e(e){t.call(this,e,vertex$1,fragment$3,{aVertexPosition:0})}return t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e,e}(PIXI.Shader);registerPlugin("wireframeShader",WireframeShader);export{Light,LightShader,AmbientLight,AmbientLightShader,PointLight,PointLightShader,DirectionalLight,DirectionalLightShader,LightRenderer,WireframeShader,plugins,diffuseGroup,normalGroup,lightGroup,registerPlugin};
//# sourceMappingURL=pixi-lights.es.js.map