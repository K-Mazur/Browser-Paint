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

        if (mode === 'image' && !this.checkImage()) {
            return false;
        }

        if(mode === 'delete') {
            this.ctx.fillStyle = "#fff";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.initSets();
            return false;
        }

        if(mode === 'save') {
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

        this.menu.color.addEventListener('change', this.changeColor.bind(this));

        this.canvasOuter.addEventListener('mousemove', this.mouseMove.bind(this));
        this.canvasOuter.addEventListener('mouseup', this.mouseDisable.bind(this));
        this.canvasOuter.addEventListener('mousedown', this.mouseEnable.bind(this));

        document.addEventListener('paste', this.paste.bind(this));

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

    changeColor: function (e) {
        this.ctx.strokeStyle = e.target.value;
        this.ctxHelper.strokeStyle = e.target.value;
    },

    mouseMove: function (e) {
        if (this.canDraw) {
            const mousePos = this.getMousePos(e);

            if (this.mode === 'draw') {
                this.ctx.lineTo(mousePos.x, mousePos.y);
                this.ctx.stroke();
            }

            switch (this.mode) {
                case 'draw':
                    this.ctx.lineTo(mousePos.x, mousePos.y);
                    this.ctx.stroke();
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
                case 'circle':
                    this.ctxHelper.clearRect(0, 0, this.canvasHelper.width, this.canvasHelper.height);
                    this.ctxHelper.beginPath();
                    this.ctxHelper.arc(this.startX, this.startY, Math.abs(mousePos.x - this.startX), 0, 2 * Math.PI);
                    this.ctxHelper.closePath();
                    this.ctxHelper.stroke();
                    break;
                case 'image':
                    if (this.checkImage()) {
                        this.ctxHelper.clearRect(0, 0, this.canvasHelper.width, this.canvasHelper.height);
                        this.ctxHelper.drawImage(this.pastedImage, mousePos.x, mousePos.y);
                        this.imgX = mousePos.x;
                        this.imgY = mousePos.y;

                        this.ctxHelper.beginPath();
                        this.ctxHelper.rect(mousePos.x, mousePos.y, this.imgWidth, this.imgHeight);
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

        if (this.mode === 'paint') {
            this.paint(this.startX, this.startY, this.ctx.getImageData(this.startX, this.startY, 1, 1).data);
        }
        else {
            this.ctx.beginPath();
            this.ctx.moveTo(this.startX, this.startY);
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
            this.setMode('image');
            this.setImageSize(this.pastedImage.naturalWidth, this.pastedImage.naturalHeight);
            this.ctxHelper.clearRect(0, 0, this.canvasHelper.width, this.canvasHelper.height);
            this.ctxHelper.drawImage(this.pastedImage, 0, 0);
            this.ctxHelper.beginPath();
            this.ctxHelper.rect(0, 0, this.imgWidth, this.imgHeight);
            this.ctxHelper.closePath();
            this.ctxHelper.stroke();
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
            this.ctxHelper.drawImage(this.pastedImage, this.imgX, this.imgY);

            this.ctx.drawImage(this.canvasHelper, 0, 0);
            this.ctxHelper.clearRect(0, 0, this.canvasHelper.width, this.canvasHelper.height);

            this.setImageSize();
            this.pastedImage = false;
        }
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
            size: document.querySelector('.km-paint input[type="range"]'),
            sizeVal: document.querySelector('.km-paint output'),
            color: document.querySelector('.km-paint input[type="color"]'),
        }

        this.menu.sizeVal.innerText = this.menu.size.value;

        this.btns = [].slice.call(document.querySelectorAll('.km-paint button, .km-paint .button'));

        this.modes = ['draw', 'line', 'rect', 'circle', 'paint', 'image', 'delete', 'save'];
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