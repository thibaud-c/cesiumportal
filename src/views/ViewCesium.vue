<template lang="pug">
// Modal Name question
.modal(:class="{'is-active': name_isActive }")
  .modal-background
  .modal-content.box
      .title {{$t("whatName")}}
      input.input(type="text" v-model="userName" @change="isUserNameError=false" autofocus)
      p.help.is-danger.has-text-left(v-if="isUserNameError") {{$t("error-userName")}}
      button.button.is-primary.is-rounded.ok-btn(@click="isValidName") OK
// Modal South
.modal(:class="{'is-active': south_isActive}")
  .modal-background
  .modal-content.box
      .subtitle {{$t("look-south")}}
      button.button.is-primary.is-rounded.ok-btn(@click="activateView") OK
// button
#switch-location
  .field.level.is-mobile(@click="islocation=!islocation;startstopPosition()")
    font-awesome-icon.icon.center-fa-icon(:icon="['fas','search-location']")
    input.switch.is-small.is-rounded.is-outlined(type='checkbox' :checked="islocation" @change="islocation?startPosition:stopPosition")
    label
#switch-view
  .field.level.is-mobile(@click="isview=!isview;startstopOrientation()")
    font-awesome-icon.icon.center-fa-icon(:icon="['fas','compass']") 
    input.switch.is-small.is-rounded.is-outlined(type='checkbox' :checked="isview" @change="isview?startOrientation:startOrientation")
    label
#ask-opinion
    button.button.is-outlined.is-rounded.is-primary(@click="islocactivated")
      font-awesome-icon.icon(:icon="['fas','comment-medical']")
//notification
.notification(v-if="isnotif")
  button.delete(@click="isnotif=false")
  | {{$t("need-loc-comp")}}
.p.oberlay-a {{alpha}}
.p.oberlay-b {{beta}}
//Type of place
participationCpt(v-if="isparticipate" @add-billboard='addBil')
#cesium-container
.box.Lbox
  //leafletCpt(:latitude='lat' :longitude='lon')

</template>

<script>
import { VcViewer } from 'vue-cesium'
import 'vue-cesium/lib/theme-default/index.css';
import axios from 'axios'
//import leafletCpt from './../components/CptLeaflet.vue'
import participationCpt from './../components/CptParticipation.vue'

export default {
  components:{
    //leafletCpt,
    participationCpt
  },
  name: "CesiumGlobeView",
  data() {
    return{
      isUserNameError:false,
      userName:'',
      name_isActive:true,
      south_isActive:false,
      isnotif:false,
      viewer:null,
      isparticipate:false,
      naviposition:null ,
      lat:0,
      lon:0,
      height:0,
      gamma:0,
      beta:90,
      alpha:180,
      a_alpha:[],
      a_beta:[],
      a_gamma:[],
      smoothing:0.25,
    }
  },
  methods: {
     /**
     * Init Cesium globe
     * 
     * @returns {Viewer} viewer from cesium
     */
    setupCesiumGlobe () {
      
      let viewer = new Cesium.Viewer('cesium-container', {
        terrainProvider: new Cesium.createWorldTerrain(),
        homeButton: false,
        baseLayerPicker:false,
        geocoder:false,
        selectionIndicator: false,
        timeline: false,
        fullscreenButton:false,
        animation : false,
        scene3DOnly:true,
        lmap:null,
        zoom:17
      });
      viewer.camera.frustum.fov = Cesium.Math.toRadians(120);
      viewer.terrainProvider.castShadows = true;
      viewer.terrainProvider.receiveShadows = true;
  
      // Avoid camera under terrain
      var controller = viewer.scene.screenSpaceCameraController;
      controller.enableCollisionDetection = true;
      controller.minimumZoomDistance = 1;
      
      // Basemap
      viewer.scene.imageryLayers.removeAll();
      var osm_basemap = new Cesium.UrlTemplateImageryProvider({
          //url: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
          //url : 'https://a.tile.openstreetmap.org/'
          url : '//wmts100.geo.admin.ch/1.0.0/ch.swisstopo.swisstlm3d-karte-farbe.3d/default/current/3857/{z}/{x}/{y}.jpeg'
      });
      viewer.scene.imageryLayers.addImageryProvider(osm_basemap);
      
      // Terrain
      let terrain = new Cesium.CesiumTerrainProvider({
          url : '//3d.geo.admin.ch/1.0.0/ch.swisstopo.terrain.3d/default/20200520/4326/'//{z}/{x}/{y}.terrain?v=1.0.0'
      });
      viewer.terrainProvider = terrain;
      
      // Buildings
      let buildings = new Cesium.Cesium3DTileset({
          url : '//vectortiles0.geo.admin.ch/3d-tiles/ch.swisstopo.swisstlm3d.3d/20201020/tileset.json'
      });
      viewer.scene.primitives.add(buildings);

      let vegetations = new Cesium.Cesium3DTileset({
          url : '//vectortiles100.geo.admin.ch/3d-tiles/ch.swisstopo.vegetation.3d/20190313/tileset.json'
      });
      viewer.scene.primitives.add(vegetations);

      // Genève projets
      viewer.dataSources.add(Cesium.KmlDataSource.load('assets/3d/geneve/CAD_BATI3D_PROJET.kmz',
          {
                camera: viewer.scene.camera,
                canvas: viewer.scene.canvas
          })
      );


      // sol1
      let latitude = 46.510095 
      let longitude = 6.616761
      let entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromRadians(longitude, latitude),
        model: {
          uri: "assets/3d/solution_1.glb",
          show:true,
          material : Cesium.Color.WHITE,
          id : 'design_1',

          scale: 1000

        },
      });
      viewer.zoomTo(viewer.entities);

      return viewer;
    },

    /////////////////////////
    ///  Camera Handling  ///
    /////////////////////////

    /**
     * Fly to position - keep the gaza at the same place
     * 
     * @param {number[]} globecenter position to fly to
     * @param {number} globeheight altitude
     * @param {number[]} orientation orientation camera
     * @param {Viewer} viewer cesium viewer
     */
    flytoView(globecenter,globeheight,orientation,viewer){
      viewer.camera.flyTo({
        destination : Cesium.Cartesian3.fromDegrees(globecenter[0], globecenter[1], globeheight),
        orientation : {
            heading : viewer.camera.heading,//Cesium.Math.toRadians(-orientation[0]),
            pitch : viewer.camera.pitch,//Cesium.Math.toRadians(orientation[1]-90),
            roll : viewer.camera.roll//0.0
        },
        duration:0.
      });
    },
    /**
     * Look at -> change the gaze of the camera
     * 
     * @param {number[]} orientation orientation camera
     * @param {Viewer} viewer cesium viewer
     */
    setView(orientation,viewer){
      viewer.camera.setView({
        orientation : {
            heading : Cesium.Math.toRadians(-orientation[0]-180),
            pitch : Cesium.Math.toRadians(orientation[1]-90),
            roll : 0.0
        },
        duration:0.
      });
    },

    ///////////////////////////
    ///  Position Handling  ///
    ///////////////////////////
 
    /**
     * Get approximate position without autorization
     */
    async getipposition(){
      let response = await axios.get('https://ipinfo.io?token='+process.env.VUE_APP_IP_INFO_TOKEN+'&format=json')
      let useriplocation = response.data.loc.split(',')
      this.lat = parseFloat(useriplocation[0]);
      this.lon = parseFloat(useriplocation[1]);
      this.flytoView([this.lon,this.lat],1000,[this.alpha,this.beta,this.gamma],this.viewer)
    },
    startstopPosition(){
      if(this.islocation){
        this.startPosition()
      }else{
        this.stopPosition()
      }
    },
    startPosition(){
      if (navigator.geolocation) {
        this.naviposition = navigator.geolocation.watchPosition(
          this.devicePositionListener, 
          () => {},
          {
              maximumAge: 1000, 
              enableHighAccuracy: Infinity
          });
      } else {
        console.log("Geolocation is not supported by this browser.");
      }
    },
    stopPosition(){
      navigator.geolocation.clearWatch(this.naviposition);
    },
    devicePositionListener(position){
      //Update position
      let lat = position.coords.latitude;
      let lon = position.coords.longitude;
      //Calculate height
      let height = this.viewer.scene.globe.getHeight(Cesium.Cartographic.fromDegrees(lon, lat))+2;

      //Continue if moved 
      if(lat==this.lat && lon == this.lon && height == this.height){
        return
      }

      this.flytoView([lon,lat],height,[this.alpha,this.beta,this.gamma],this.viewer)
      this.lat = lat;
      this.lon = lon;
      this.height = height;
    },

    //////////////////////////////
    ///  Orientation Handling  ///
    //////////////////////////////

    startstopOrientation(){
      if(this.isview){
        this.south_isActive= true;
      }else{
        this.stopOrientation()
      }
    },
    startOrientation(){
      if (window.DeviceOrientationEvent) {
        const options = { frequency: 50 };

    const accl = new Accelerometer(options);
    const gyro = new Gyroscope(options);

    let timestamp = null;
    let alpha = 0
    let beta = 0
    let gamma = 0;
    const bias = 0.98;
    const zeroBias = 0.02;


      gyro.onreading = () => {
        let dt = timestamp ? (gyro.timestamp - timestamp) / 1000 : 0;
        timestamp = gyro.timestamp;

        // Treat the acceleration vector as an orientation vector by normalizing it.
        // Keep in mind that the if the device is flipped, the vector will just be
        // pointing in the other direction, so we have no way to know from the
        // accelerometer data which way the device is oriented.
        const norm = Math.sqrt(accl.x ** 2 + accl.y ** 2 + accl.z ** 2);

        // As we only can cover half (PI rad) of the full spectrum (2*PI rad) we multiply
        // the unit vector with values from [-1, 1] with PI/2, covering [-PI/2, PI/2].
        const scale = Math.PI / 2;

        alpha = (1 - zeroBias) * (this.alpha + gyro.z * dt);
        beta = bias * (this.beta + gyro.x * dt) + (1.0 - bias) * (accl.x * scale / norm);
        gamma = bias * (this.gamma + gyro.y * dt) + (1.0 - bias) * (accl.y * -scale / norm);

        this.setView([alpha,beta,gamma],this.viewer)
      };

        accl.start();
        
        gyro.start();
        window.addEventListener('deviceorientation', this.deviceOrientationListener);
      }else{
        console.log("Sorry, your browser doesn't support Device Orientation.");
      }
    },
    stopOrientation(){
      window.removeEventListener('deviceorientation', this.deviceOrientationListener);
      this.alpha = 0;
      this.beta = 0;
      this.gamma = 0;
    },
    deviceOrientationListener(event) {
      //Create array of angles, up to 50 angles
      /*if(this.a_alpha.length<=50){
        // beta: front back motion
        this.a_beta.push(parseInt(event.beta));
        // gamma: left to right
        this.a_gamma.push(parseInt(event.gamma));
        // alpha: rotation around z-axis
        this.a_alpha.push(parseInt(event.alpha));
        return;
      }
      
      //calculate average angles, and update
      this.beta = this.a_beta.reduce((a, b) => a + b) / this.a_beta.length;
      this.gamma = this.a_gamma.reduce((a, b) => a + b) / this.a_gamma.length;
      this.alpha = this.a_alpha.reduce((a, b) => a + b) / this.a_alpha.length;

      this.setView([this.alpha,this.beta,this.gamma],this.viewer)
      this.a_beta=[];
      this.a_gamma=[];
      this.a_alpha=[];
      */

      //this.alpha = event.alpha + this.smoothing*(this.alpha - event.alpha)
      this.alpha = event.alpha
      this.beta = event.beta
      this.gamma = event.gamma
      //let alpha_cal = this.compassHeading(this.alpha,this.beta,this.gamma)
      //this.setView([alpha_cal,this.beta,this.gamma],this.viewer)
    },

    

    compassHeading( alpha, beta, gamma ) {
      var degtorad = Math.PI / 180; // Degree-to-Radian conversion
      var _x = beta  ? beta  * degtorad : 0; // beta value
      var _y = gamma ? gamma * degtorad : 0; // gamma value
      var _z = alpha ? alpha * degtorad : 0; // alpha value

      var cX = Math.cos( _x );
      var cY = Math.cos( _y );
      var cZ = Math.cos( _z );
      var sX = Math.sin( _x );
      var sY = Math.sin( _y );
      var sZ = Math.sin( _z );

      // Calculate Vx and Vy components
      var Vx = - cZ * sY - sZ * sX * cY;
      var Vy = - sZ * sY + cZ * sX * cY;

      // Calculate compass heading
      var compassHeading = Math.atan( Vx / Vy );

      // Convert compass heading to use whole unit circle
      if( Vy < 0 ) {
        compassHeading += Math.PI;
      } else if( Vx < 0 ) {
        compassHeading += 2 * Math.PI;
      }

      return compassHeading * ( 180 / Math.PI ); // Compass Heading (in degrees)

    },
    /**
     * Modal look South handling
     */
    activateView(){
      this.south_isActive = false;
      this.startOrientation();
    },
  
    addBil(data){
      var billboard = this.viewer.entities.add({
        position : new Cesium.Cartesian3(this.viewer.camera.position.x,this.viewer.camera.position.y,this.viewer.camera.position.z+10),
        billboard : {
          image : 'icons/'+data.opinion+'.png',
          pixelOffset:new Cesium.Cartesian2(0, 100),
          width : 40,
          height : 40
        },
        label : {
          text : this.userName,
          font : '12px Helvetica',
          fillColor : Cesium.Color.WHITE,
          style: Cesium.LabelStyle.FILL,
          verticalOrigin : Cesium.VerticalOrigin.TOP,
          pixelOffset : new Cesium.Cartesian2(0, 32)
        }
      });
      // Fill info box
      billboard.name = this.userName;
      billboard.description = '\
      <img\
        width="45%"\
        style="float:left; margin: 0 1em 1em 0;"\
        src="icons/'+data.billboard+'.png"/>\
      <p>\
        '+data.billboard+'\
      </p>\
      <br>\
      <img\
        width="45%"\
        style="float:left; margin: 0 1em 1em 0;"\
        src="icons/'+data.opinion+'.png"/>\
      <p>\
        '+data.opinion+'\
      </p>\
      <br>\
      <br>\
      <p>\
        '+data.comment+'\
      </p>'

      this.isparticipate = false;
    },

    /////////////////////////////
    ///  Validator Handling  ///
    ////////////////////////////

    islocactivated(){
      if(!this.isview || !this.islocation){
        this.isnotif=true;
        return
      }
      this.isparticipate=true;
    },
    isValidName(){
      console.log(this.userName.length)
      if(this.userName.length == 0){
        this.isUserNameError = true;
        return;
      }
      this.name_isActive=false
    },
  },
  mounted() {
    // add cesium ion token to the app
    Cesium.Ion.defaultAccessToken = process.env.VUE_APP_CESIUM_ION_TOKEN;
    this.viewer = this.setupCesiumGlobe();
    if(Cesium.Fullscreen.supportsFullscreen()){
      Cesium.Fullscreen.requestFullscreen(document.body)
    }
    this.getipposition();

    

  },
};
</script>

<style scoped>
#cesium-container {
  position:absolute;
  top:0%;
  height: 100%;
  width:100%;
}
.center-fa-icon
{
  width:50%;
  position: relative;
}
#switch-location{
  position:absolute;
  top: 40%;
  left:3%;
  z-index: 1;
}
#switch-view{
  position:absolute;
  top: 60%;
  left:3%;
  z-index: 1;
}
#ask-opinion{
  position:absolute;
  top: 50%;
  right:5%;
  z-index: 1;
}
.fa-compass{
  color:white;
  margin-right: 10px;
  top: 5px;
}
.fa-search-location{
  color:white;
  top: 5px;
  margin-right: 10px;
}
.box{
  background-color:rgba(250, 250, 250, 0.9);
}
.notification{
  z-index: 1;
  width:80%;
  margin: auto;
}
.ok-btn{
  margin-top:4%;
  width:20%;
}
.modal-content{
  width:80%;
  top:-20%;
}
.Lbox{
  padding: 2px;
  z-index: 0;
  position:absolute;
  bottom: 0%;
  height:20%;
  width:100%;
}
.oberlay-a{
  position:absolute;
  top:2%;
  left:5%;
  z-index: 10;
}
.oberlay-b{
  position:absolute;
  top:5%;
  left:5%;
  z-index: 10;
}
</style>