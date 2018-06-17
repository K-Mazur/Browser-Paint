const paint = {
    createCanvas: function () {
        const canvas = document.createElement('canvas');
        canvas.width = this.canvasOuter.offsetWidth;
        canvas.height = this.canvasOuter.offsetHeight;
        return canvas;
    },

    initSets: function (ctx) {
        ctx = typeof ctx !== 'undefined' ? ctx : this.ctx;
        ctx.lineWidth = this.menu.size.value;
        ctx.lineJoin = "round"; //Create a rounded corner when the two lines meet
        ctx.lineCap = "round"; //Draw a line with rounded end caps
        ctx.strokeStyle = this.menu.color.value;
        ctx.fillStyle = this.menu.color.value;
        ctx.font = "30px Arial";
    },

    rgbToHex: function (r, g, b) {
        if (r > 255 || g > 255 || b > 255)
            throw "Invalid color component";
        return ((r << 16) | (g << 8) | b).toString(16);
    },

    setMode: function (mode) {
        mode = typeof mode !== 'undefined' ? mode : 'draw';

        if (this.modes.indexOf(mode) === -1) {
            return false;
        }

        if (this.mode === 'image') {
            this.pasteImageToMainCanvas();
        }

        if (this.mode === 'mark') {
            this.ctxHelper.clearRect(0, 0, this.canvasHelper.width, this.canvasHelper.height);
            if (mode === 'delete') {
                this.ctx.clearRect(this.mark.startX, this.mark.startY, this.mark.endX, this.mark.endY);
            }
            this.setMark(0, 0, 0, 0);
        }

        if (this.mode === 'text') {
            this.ctx.drawImage(this.canvasHelper, 0, 0);
            this.ctxHelper.clearRect(0, 0, this.canvasHelper.width, this.canvasHelper.height);
        }

        if (mode === 'image' && !this.checkImage()) {
            return false;
        }

        if (mode === 'delete' && this.mode != 'mark') {
            this.ctx.fillStyle = "#fff";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.initSets();
            return false;
        }



        if(this.models3d.indexOf(mode) > -1) {
            if (this.models3d.indexOf(this.mode) > -1) {
                this.setMode('draw');
                return false;
            }
            else {
                this.init3d(mode);
            }
        }

        if (this.models3d.indexOf(this.mode) > -1) {
            var gl = this.renderer.getContext();
            this.ctx.drawImage(gl.canvas, 0, 0);
            cancelAnimationFrame(this.animationID);
            this.renderer.clear();
            this.camera = false;
            this.controls = false;
            this.scene = false;
            this.mesh = false;
            this.renderer = false;
            this.canvas3d.parentNode.removeChild(this.canvas3d);
        }

        if (mode === 'save') {
            var image = this.canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");  // here is the most important part because if you dont replace you will get a DOM 18 exception.
            document.querySelector('.km-paint a[data-for="save"]').href = image;
            return false;
        }

        this.btns.forEach(btn => {
            btn.classList.remove('active');
        });

        this.btns.filter(el => {
            return el.dataset.for === mode
        })[0].classList.add('active');

        this.mode = mode;
    },

    setEvents: function () {
        this.menu.size.addEventListener('change', this.changeSize.bind(this));
        this.menu.size.addEventListener('input', this.changeSize.bind(this));

        this.menu.imgSize.addEventListener('change', this.changeImgSize.bind(this));
        this.menu.imgSize.addEventListener('input', this.changeImgSize.bind(this));

        this.menu.color.addEventListener('change', this.changeColor.bind(this));

        this.canvasOuter.addEventListener('mousemove', this.mouseMove.bind(this));
        this.canvasOuter.addEventListener('mouseup', this.mouseDisable.bind(this));
        this.canvasOuter.addEventListener('mousedown', this.mouseEnable.bind(this));

        document.addEventListener('paste', this.paste.bind(this));

        document.addEventListener('keydown', this.setString.bind(this));

        this.btns.forEach(el => {
            el.addEventListener('click', e => {
                this.setMode(e.currentTarget.dataset.for);
            });
        }, this)
    },

    changeSize: function (e) {
        this.menu.sizeVal.innerText = e.target.value;
        this.ctx.lineWidth = e.target.value;
        this.ctxHelper.lineWidth = e.target.value;
    },


    changeImgSize: function (e) {
        this.menu.imgSizeVal.innerText = e.target.value;

        if (this.checkImage()) {
            this.ctxHelper.clearRect(0, 0, this.canvasHelper.width, this.canvasHelper.height);
            this.ctxHelper.drawImage(this.pastedImage, this.imgX, this.imgY, this.imgWidth * parseFloat(this.menu.imgSize.value), this.imgHeight * parseFloat(this.menu.imgSize.value));

            this.ctxHelper.beginPath();
            this.ctxHelper.rect(this.imgX, this.imgY, this.imgWidth * parseFloat(this.menu.imgSize.value), this.imgHeight * parseFloat(this.menu.imgSize.value));
            this.ctxHelper.closePath();
            this.ctxHelper.stroke();
        }
    },

    changeColor: function (e, directValue) {
        directValue = typeof directValue === 'undefined' ? false : directValue;
        this.ctx.strokeStyle = directValue ? e : e.target.value;
        this.ctxHelper.strokeStyle = directValue ? e : e.target.value;
    },

    mouseMove: function (e) {
        if (this.canDraw) {
            const mousePos = this.getMousePos(e);

            switch (this.mode) {
                case 'draw':
                    this.ctx.lineTo(mousePos.x, mousePos.y);
                    this.ctx.stroke();
                    break;
                case 'rubber':
                    let width = (0.5 * this.menu.size.value);
                    this.ctx.clearRect(parseInt(mousePos.x - width, 10), parseInt(mousePos.y - width, 10), width, width);
                    break;
                case 'line':
                    this.ctxHelper.clearRect(0, 0, this.canvasHelper.width, this.canvasHelper.height);
                    this.ctxHelper.beginPath();
                    this.ctxHelper.moveTo(this.startX, this.startY);
                    this.ctxHelper.lineTo(mousePos.x, mousePos.y);
                    this.ctxHelper.closePath();
                    this.ctxHelper.stroke();
                    break;
                case 'rect':
                    this.ctxHelper.clearRect(0, 0, this.canvasHelper.width, this.canvasHelper.height);
                    this.ctxHelper.beginPath();
                    this.ctxHelper.moveTo(this.startX, this.startY);
                    this.ctxHelper.rect(this.startX, this.startY, mousePos.x - this.startX, mousePos.y - this.startY);
                    this.ctxHelper.closePath();
                    this.ctxHelper.stroke();
                    break;
                case 'mark':
                    this.ctxHelper.clearRect(0, 0, this.canvasHelper.width, this.canvasHelper.height);
                    this.ctxHelper.beginPath();
                    this.ctxHelper.moveTo(this.startX, this.startY);
                    this.ctxHelper.rect(this.startX, this.startY, mousePos.x - this.startX, mousePos.y - this.startY);
                    this.ctxHelper.closePath();
                    this.ctxHelper.stroke();
                    this.setMark(this.startX, this.startY, mousePos.x - this.startX, mousePos.y - this.startY);
                    break;
                case 'circle':
                    this.ctxHelper.clearRect(0, 0, this.canvasHelper.width, this.canvasHelper.height);
                    this.ctxHelper.beginPath();
                    this.ctxHelper.arc(this.startX, this.startY, Math.abs(mousePos.x - this.startX), 0, 2 * Math.PI);
                    this.ctxHelper.closePath();
                    this.ctxHelper.stroke();
                    break;
                case 'image':
                    if (this.checkImage()) {
                        let w = this.imgWidth * parseFloat(this.menu.imgSize.value);
                        let h = this.imgHeight * parseFloat(this.menu.imgSize.value);
                        this.ctxHelper.clearRect(0, 0, this.canvasHelper.width, this.canvasHelper.height);
                        this.ctxHelper.drawImage(this.pastedImage, mousePos.x - (0.5 * w), mousePos.y - (0.5 * h), w, h);
                        this.imgX = mousePos.x - (0.5 * w);
                        this.imgY = mousePos.y - (0.5 * h);

                        this.ctxHelper.beginPath();
                        this.ctxHelper.rect(mousePos.x - (0.5 * w), mousePos.y - (0.5 * h), w, h);
                        this.ctxHelper.closePath();
                        this.ctxHelper.stroke();
                    }
                    break;
                default:
                    break;
            }
        }

    },

    mouseDisable: function (e) {
        this.canDraw = false;

        if (this.mode === 'line' || this.mode === 'rect' || this.mode === 'circle') {
            this.ctx.drawImage(this.canvasHelper, 0, 0);
            this.ctxHelper.clearRect(0, 0, this.canvasHelper.width, this.canvasHelper.height);
        }
    },

    mouseEnable: function (e) {
        this.canDraw = true;

        const mousePos = this.getMousePos(e);
        this.startX = mousePos.x;
        this.startY = mousePos.y;

        if (this.mode === 'text') {
            this.enableKeyboard = true;
            this.keyboardText = '';
        }
        else if (this.mode === 'pipette') {
            let p = this.ctx.getImageData(this.startX, this.startY, 1, 1).data;
            this.menu.color.value = "#" + ("000000" + this.rgbToHex(p[0], p[1], p[2])).slice(-6);

            this.changeColor(this.menu.color.value, true);
        }
        else if (this.mode === 'paint') {
            this.paint(this.startX, this.startY, this.ctx.getImageData(this.startX, this.startY, 1, 1).data);
        }
        else {
            this.ctx.beginPath();
            this.ctx.moveTo(this.startX, this.startY);
        }
    },

    setString: function (e) {
        if (this.enableKeyboard && this.allowedChars.includes(e.key)) {
            this.keyboardText += (e.key != 'Enter' ? e.key : ' ');
            this.ctxHelper.clearRect(0, 0, this.canvasHelper.width, this.canvasHelper.height);
            this.ctxHelper.fillText(this.keyboardText, this.startX, this.startY);
            if (e.keyCode == 32 && e.target == document.body) {
                e.preventDefault();
            }
        }
    },

    getMousePos: function (e) {
        return {
            x: (e.pageX - this.getElementPos(this.canvas).left),
            y: (e.pageY - this.getElementPos(this.canvas).top),
        };
    },

    getElementPos: function (obj) {
        let top = 0;
        let left = 0;
        while (obj && obj.tagName != "BODY") {
            top += obj.offsetTop - obj.scrollTop;
            left += obj.offsetLeft - obj.scrollLeft;
            obj = obj.offsetParent;
        }
        return {
            top: top,
            left: left
        };
    },

    hexToRgb: function (hex) {
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, function (m, r, g, b) {
            return r + r + g + g + b + b;
        });

        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },

    paint: function (x, y, oldColor) {
        let points = [];
        let point;
        points.push({
            x: x,
            y: y
        });
        let imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const width = this.canvas.width;
        const newColor = this.hexToRgb(this.menu.color.value);
        while (points.length) {
            point = points.pop();
            if (imageData.data[(point.y * width + point.x) * 4 + 0] == oldColor[0] &&
                imageData.data[(point.y * width + point.x) * 4 + 1] == oldColor[1] &&
                imageData.data[(point.y * width + point.x) * 4 + 2] == oldColor[2]) {

                imageData.data[(point.y * width + point.x) * 4 + 0] = newColor.r;
                imageData.data[(point.y * width + point.x) * 4 + 1] = newColor.g;
                imageData.data[(point.y * width + point.x) * 4 + 2] = newColor.b;

                points.push({
                    x: point.x + 1,
                    y: point.y,
                });
                points.push({
                    x: point.x - 1,
                    y: point.y,
                });
                points.push({
                    x: point.x,
                    y: point.y + 1,
                });
                points.push({
                    x: point.x,
                    y: point.y - 1,
                });
            }
        }
        this.ctx.putImageData(imageData, 0, 0);
    },

    paste: function (e) {
        if (e.clipboardData) {
            let items = e.clipboardData.items;
            if (!items) {
                return;
            }

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    var blob = items[i].getAsFile();
                    var URLObj = window.URL || window.webkitURL;
                    var source = URLObj.createObjectURL(blob);
                    this.pasteImage(source);
                }
            }

            e.preventDefault();
        }
    },

    pasteImage: function (source) {
        this.pastedImage = new Image();
        this.pastedImage.addEventListener('load', function () {
            this.setImageSize(this.pastedImage.naturalWidth, this.pastedImage.naturalHeight);
            this.ctxHelper.clearRect(0, 0, this.canvasHelper.width, this.canvasHelper.height);
            this.ctxHelper.drawImage(this.pastedImage, 0, 0, this.imgWidth * parseFloat(this.menu.imgSize.value), this.imgHeight * parseFloat(this.menu.imgSize.value));
            this.ctxHelper.beginPath();
            this.ctxHelper.rect(0, 0, this.imgWidth * parseFloat(this.menu.imgSize.value), this.imgHeight * parseFloat(this.menu.imgSize.value));
            this.ctxHelper.closePath();
            this.ctxHelper.stroke();
            this.setMode('image');
        }.bind(this));
        this.pastedImage.src = source;
    },

    setImageSize: function (w, h) {
        if (typeof w === 'undefined' || typeof h === 'undefined') {
            this.imgWidth = -1;
            this.imgHeight = -1;
            this.imgX = -1;
            this.imgY = -1;
        }
        else {
            this.imgWidth = w;
            this.imgHeight = h;
            this.imgX = 0;
            this.imgY = 0;
        }
    },

    checkImage: function () {
        return (this.pastedImage !== false && this.imgWidth !== -1 && this.imgHeight !== -1);
    },

    pasteImageToMainCanvas: function () {
        if (this.checkImage()) {
            this.ctxHelper.clearRect(0, 0, this.canvasHelper.width, this.canvasHelper.height);
            this.ctxHelper.drawImage(this.pastedImage, this.imgX, this.imgY, this.imgWidth * parseFloat(this.menu.imgSize.value), this.imgHeight * parseFloat(this.menu.imgSize.value));

            this.ctx.drawImage(this.canvasHelper, 0, 0);
            this.ctxHelper.clearRect(0, 0, this.canvasHelper.width, this.canvasHelper.height);

            this.setImageSize();
            this.pastedImage = false;
        }
    },

    setMark: function (sX, sY, eX, eY) {
        this.mark.startX = sX;
        this.mark.startY = sY;
        this.mark.endX = eX;
        this.mark.endY = eY;
    },

    animate: function () {
        this.animationID = requestAnimationFrame(this.animate.bind(this));
        // this.position.x+=0.05;
        // this.position.y+=0.05;


        // this.mesh.rotation.x += 0.005;
        // this.mesh.rotation.y += 0.01;
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    },
    init3d: function (geo) {
        this.camera = new THREE.PerspectiveCamera(70, this.canvas.width / this.canvas.height, 1, 1000);
        this.camera.position.z = 400;
        this.scene = new THREE.Scene();
        var texture = new THREE.TextureLoader().load('images/crate.gif');

        var geometry;

        switch (geo) {
            case 'cone':
                geometry = new THREE.ConeGeometry(50, 200, 32);
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(50, 50, 200, 32);
                break;
            case 'octahedron':
                geometry = new THREE.OctahedronGeometry(100, 0);
                break;
            case 'heart':
                var heartShape = new THREE.Shape();

                let x = 0;
                let y = 0;
                heartShape.moveTo( x + 50, y + 50 );
                heartShape.bezierCurveTo( x + 50, y + 50, x + 40, y, x, y );
                heartShape.bezierCurveTo( x - 60, y, x - 60, y + 70,x - 60, y + 70 );
                heartShape.bezierCurveTo( x - 60, y + 110, x - 30, y + 154, x + 50, y + 190 );
                heartShape.bezierCurveTo( x + 120, y + 154, x + 160, y + 110, x + 160, y + 70 );
                heartShape.bezierCurveTo( x + 160, y + 70, x + 160, y, x + 100, y );
                heartShape.bezierCurveTo( x + 70, y, x + 50, y + 50, x + 50, y + 50 );

                geometry = new THREE.ShapeGeometry(heartShape);
                break;
            case 'cube':
            default:
                geometry = new THREE.BoxBufferGeometry(200, 200, 200);
                break;
        }

        var material = new THREE.MeshBasicMaterial({map: texture});
        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);
        this.scene.updateMatrixWorld(true);
        this.position = new THREE.Vector3();
        this.position.getPositionFromMatrix( this.mesh.matrixWorld );

        this.renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true, alpha: true});
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.canvas.width, this.canvas.height);
        this.renderer.domElement.classList.add('canvas-3d');
        if (!(document.querySelector('.canvas .canvas-3d')))
            this.canvasOuter.appendChild(this.renderer.domElement);
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.canvas3d = document.querySelector('.canvas .canvas-3d');

        this.animate();

    },

    init: function () {
        this.canvasOuter = document.querySelector('.canvas');

        this.canvas = this.createCanvas();
        this.canvasOuter.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.ctx.fillStyle = "#fff";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Canvas pomocniczy:
        this.canvasHelper = this.createCanvas();
        this.canvasOuter.appendChild(this.canvasHelper);
        this.ctxHelper = this.canvasHelper.getContext('2d');


        this.menu = {
            size: document.querySelector('.km-paint input[type="range"].range-size'),
            sizeVal: document.querySelector('.km-paint output.size'),
            imgSize: document.querySelector('.km-paint input[type="range"].range-img-size'),
            imgSizeVal: document.querySelector('.km-paint output.img_size'),
            color: document.querySelector('.km-paint input[type="color"]'),
        };

        this.mark = {
            startX: 0,
            startY: 0,
            endX: 0,
            endY: 0
        };

        this.enableKeyboard = false;
        this.keyboardText = '';
        this.allowedChars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'r', 's', 't', 'u', 'w', 'x', 'y', 'z', 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, ' ', 'Enter'];

        this.menu.sizeVal.innerText = this.menu.size.value;
        this.menu.imgSizeVal.innerText = this.menu.imgSize.value;

        this.btns = [].slice.call(document.querySelectorAll('.km-paint button, .km-paint .button'));

        this.modes = ['draw', 'line', 'rect', 'circle', 'paint', 'image', 'delete', 'save', 'mark', 'pipette', 'rubber', 'text', 'cube', 'cone', 'cylinder', 'octahedron', 'heart'];
        this.models3d = ['cube', 'cone', 'cylinder', 'octahedron', 'heart'];
        this.canDraw = false;

        this.setMode();

        this.initSets();
        this.initSets(this.ctxHelper);

        this.setEvents();

        this.imgWidth = -1;
        this.imgHeight = -1;
        this.pastedImage = false;
        this.imgX = -1;
        this.imgY = -1;
    }
}

paint.init();