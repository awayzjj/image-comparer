const dialog = require('electron').remote.dialog;
const currentWindow = require("electron").remote.getCurrentWindow();

// set UI Control
let app = angular.module('app', ['ngMaterial']);
app.controller('controller', initController);

app.config(function($mdThemingProvider) {
    $mdThemingProvider.theme('default')
    .primaryPalette('pink')
    .dark();
});

function initController( $scope ) {
    // 3D settings
    let camera, scene, renderer;
    // render DOM
    let container = document.getElementById( 'container' );
    // control DOM
    let control   = document.getElementById( 'control' );
    // camera control
    let cameraControl;
    // control
    let isControlShow = true;
    
    // add event listener
    document.body.addEventListener('keydown', onKeyDown);
    
    document.ondragover = document.ondrop = (ev) => {
        ev.preventDefault();
    }

    document.body.ondrop = (ev) => {
        for (let i = 0; i < ev.dataTransfer.files.length; ++i) {
            const fileName = ev.dataTransfer.files[i].path;
            loadImage( fileName );
        }
        ev.preventDefault();
    }

    init();
    //openDialog();
    
    $scope.cfg = cfg;
    $scope.fullScreenIconPath = 'assets/ic_fullscreen_white_24px.svg';
    
    $scope.onFileNameClick = function ( idx ) {
        showImage( idx );
    }
    
    $scope.onHideClick = function () {
        toggleShowControl();
    }
    
    $scope.onFullScreenClick = function() {
        let isFullScreen = currentWindow.isFullScreen();
        if ( isFullScreen ) {
            $scope.fullScreenIconPath = 'assets/ic_fullscreen_white_24px.svg';
        } else {
            $scope.fullScreenIconPath = 'assets/ic_fullscreen_exit_white_24px.svg';
        }
        currentWindow.setFullScreen( !isFullScreen );
    }
    
    $scope.onResetClick = function () {
        cameraControl.reset();
    }
    
    function showImage( idx ) {
        if ( idx >= scene.children.length ) return;
        
        // hide all layers
        for(let i = 0; i < scene.children.length; ++i) {
            let o = scene.children[i];
            o.visible = false;
        }
        // show selected layer
        scene.children[idx].visible = true;
        
        renderOnce();
    }

    function init() {
        let halfWidth  = window.innerWidth  / 2;
        let halfHeight = window.innerHeight / 2;

        camera   = new THREE.OrthographicCamera( -halfWidth, halfWidth, halfHeight, -halfHeight, 1, 1000 );
        scene    = new THREE.Scene();
        renderer = new THREE.WebGLRenderer();

        camera.position.z = 1000;
        
        // set renderer
        renderer.setPixelRatio( window.devicePixelRatio );
        container.appendChild( renderer.domElement );
        
        // set camera control
        cameraControl = new CameraControl( camera, document.body, renderOnce );

        // set windows size
        window.addEventListener( 'resize', onWindowResize, false );
        onWindowResize();
        
        renderOnce();
    }

    function openDialog() {
        dialog.showOpenDialog({properties: ['multiSelections']}, onDialogClose);
    }
    
    function onKeyDown( event ) {
        let key = event.keyCode;
        
        // 1~9
        if ( key >= 97 && key <= 105 ) {
            showImage( key-97 );
            return;
        }
        if ( key >= 49 && key <= 57 ) {
            showImage( key-49 );
            return;
        }
        
        switch ( key ) {
            case 79:  // o
                openDialog();
                break;
            case 27: // ESC
                toggleShowControl();
                break;
            case 82: // r
                cameraControl.reset();
                break;
            default:
                console.log( key );
                break;
        }
        
        renderOnce();
    }
    
    function onDialogClose( filePaths ) {
        if ( !filePaths )           return;
        if ( filePaths.length < 1 ) return;
        
        for (let i = 0; i < filePaths.length; ++i) {
            const fileName = filePaths[i];
            loadImage( fileName );
        }
    }
    
    function loadImage( fileName ) {
        let loader = new THREE.TextureLoader();
        loader.load(fileName, function( texture ) {
            // set texture
            onTextureLoad( texture );
            
            // push file name
            cfg.files.push( fileName );
            $scope.$apply();
            renderOnce();
        });
    }
    
    function onTextureLoad( texture ) {
        const width  = texture.image.width;
        const height = texture.image.height;
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        let material = new THREE.MeshBasicMaterial( {
            transparent: true,
            map: texture
        });
        let geometry = new THREE.PlaneBufferGeometry( width, height );
        let plane    = new THREE.Mesh( geometry, material );
        scene.add( plane );
        
        // show readed image
        showImage( scene.children.length-1 );
    }

    function onWindowResize() {
        let halfWidth  = window.innerWidth  / 2;
        let halfHeight = window.innerHeight / 2;

        camera.left   = -halfWidth;
        camera.right  =  halfWidth;
        camera.top    =  halfHeight;
        camera.bottom = -halfHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );
        renderOnce();
    }
    
    function toggleShowControl() {
        if ( isControlShow ) {
            control.style.visibility = 'hidden'; 
        } else {
            control.style.visibility = 'visible';
        }
        isControlShow = !isControlShow;
    }

    function renderOnce() {
        renderer.render( scene, camera );
    }
}
