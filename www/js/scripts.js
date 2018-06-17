/**
 * @file Canvas Browser Paint
 * @author Kamil Mazur <kmazur@kamilmazur.pl>
 * @version 1.2
 */


/**
 * Główny obiekt Paint'a.
 */
const paint = {
    /**
     * Tworzy element canvas.
     * @constructor
     * @returns {canvas} Zwraca element canvas
     */
    createCanvas: function () {
        const canvas = document.createElement('canvas'); // utworzenie elementu canvas
        canvas.width = this.canvasOuter.offsetWidth; // ustawienie szerokości canvas'a
        canvas.height = this.canvasOuter.offsetHeight; // ustawienie wysokości canvas'a
        return canvas;
    },

    /**
     * Ustawia podstawowe właściwości context'u elementu canvas.
     * @constructor
     * @param {context} ctx - Context elementu canvas
     */
    initSets: function (ctx) {
        ctx = typeof ctx !== 'undefined' ? ctx : this.ctx; // Jeśli ctx nie został podany to ustawiaj ctx głównego canvas'a
        ctx.lineWidth = this.menu.size.value; // Ustawienie szerokości linii
        ctx.lineJoin = "round"; // Ustawienie zaokrąglonego rogu dla złączonych linii
        ctx.lineCap = "round"; // Ustawienie zaokrąglenia dla początku i końca linii
        ctx.strokeStyle = this.menu.color.value; // Ustawienie koloru pędzla
        ctx.fillStyle = this.menu.color.value; // Ustawienie koloru wypełnienia
        ctx.font = "30px Arial"; // Ustawienie czcionki
    },

    /**
     * Ustawia tryb pracy programu.
     * @constructor
     * @param {string} mode - Tryb do ustawienia
     * @returns {(boolean|void)} Zwraca false lub nic
     */
    setMode: function (mode) {
        mode = typeof mode !== 'undefined' ? mode : 'draw'; // Jeżeli nie został podany mode to ustaw na 'draw'

        if (this.modes.indexOf(mode) === -1) { // Jeżeli podany mode nie jest dozwolony to:
            return false; // zwróć false
        } // endif

        if (this.mode === 'image') { // Jeżeli aktualny mode == 'image' to:
            this.pasteImageToMainCanvas(); // Wywołaj metodę wklejania obrazu
        } // endif

        if (this.mode === 'mark') { // Jeżeli aktualny mode == 'mark' to:
            this.ctxHelper.clearRect(0, 0, this.canvasHelper.width, this.canvasHelper.height); // Wyczyść pomocniczy canvas
            if (mode === 'delete') { // Jeżeli ustawiany mode == 'delete' to:
                this.ctx.clearRect(this.mark.startX, this.mark.startY, this.mark.endX, this.mark.endY); // Wyczyść zaznaczony wcześniej obszar
            } // endif
            this.setMark(0, 0, 0, 0); // Wyczyść zaznaczenie
        } // endif

        if (this.mode === 'text') { // Jeżeli aktualny mode == 'text' to:
            this.ctx.drawImage(this.canvasHelper, 0, 0); // Przekopiuj canvas pomocniczy na canvas główny
            this.ctxHelper.clearRect(0, 0, this.canvasHelper.width, this.canvasHelper.height); // Wyczyść canvas pomocniczy
        } // endif

        if (mode === 'image' && !this.checkImage()) { // Jeżeli ustawiany mode == 'image' i nie został załadowany obrazek to:
            return false; // zwróć false
        } // endif

        if (mode === 'delete' && this.mode != 'mark') { // Jeżeli ustawiany mode == 'delete' i aktualny mode != 'mark' to:
            this.ctx.fillStyle = "#fff"; // Ustaw wypełnienie na białe
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); // Wypełnij obraz białym kolorem
            this.initSets(); // Przywróć ustawienia początkowe
            return false; // zwróć false
        } // endif

        if (this.models3d.indexOf(mode) > -1) { // Jeżeli ustawiany mode znajduje się w tablicy modeli 3d to:
            if (this.models3d.indexOf(this.mode) > -1) { // Jeżeli aktualny mode znajduje się w tablicy modeli 3d to:
                this.setMode('draw'); // ustaw mode na 'draw'
                return false; // zwróć false
            } else { // else:
                this.init3d(mode); // Ustaw mode na wybrany 3d mode
            } // endif
        } //endif

        if (this.models3d.indexOf(this.mode) > -1) { // Jeżeli obecny mode znajduje się w tablicy modeli 3d to:
            let gl = this.renderer.getContext(); // Ustaw gl na context render'a
            this.ctx.drawImage(gl.canvas, 0, 0); // Wklej zawartość canvas'u 3d to głównego canvasu
            cancelAnimationFrame(this.animationID); // Wyłącz animację w canvasie 3d
            this.renderer.clear(); // Wyczyść canvas 3d
            this.camera = false; // Usuń kamerę
            this.controls = false; // Usuń układ sterowania
            this.scene = false; // Usuń scenę
            this.mesh = false; // Usuń siatkę
            this.renderer = false; // Usuń render
            this.canvas3d.parentNode.removeChild(this.canvas3d); // Usuń element canvas 3d
        } // endif

        if (mode === 'save') { // Jeżeli ustawiany mode == 'save'
            let image = this.canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");  // zapisz główny canvas do zmiennej image jako png
            document.querySelector('.km-paint a[data-for="save"]').href = image; // Ustaw wartość linku zapisu na zmienną image
            return false; // Zwróć false
        } // endif

        this.btns.forEach(btn => { // Dla wszystkich przycisków z menu:
            btn.classList.remove('active'); // Usuń klasę 'active'
        }); // endforeach

        this.btns.filter(el => { // Znajdź button który:
            return el.dataset.for === mode // ma atrybut data-for równy ustawianemu mode
        })[0].classList.add('active'); // dodaj temu buttonowi klasę 'active'

        this.mode = mode; // Ustaw aktualny mode na ustawiany mode
    },

    /**
     * Ustawia events (zdarzenia).
     * @constructor
     */
    setEvents: function () {
        this.menu.size.addEventListener('change', this.changeSize.bind(this)); // Przekaż event 'change' elementu zmiany rozmiaru do metody changeSize
        this.menu.size.addEventListener('input', this.changeSize.bind(this)); // Przekaż event 'input' elementu zmiany rozmiaru do metody changeSize

        this.menu.imgSize.addEventListener('change', this.changeImgSize.bind(this)); // Przekaż event 'change' elementu zmiany rozmiaru zdjęcia do metody changeImgSize
        this.menu.imgSize.addEventListener('input', this.changeImgSize.bind(this)); // Przekaż event 'input' elementu zmiany rozmiaru zdjęcia do metody changeImgSize

        this.menu.color.addEventListener('change', this.changeColor.bind(this)); // Przekaż event 'change' elementu zmiany koloru do metody changeColor

        this.canvasOuter.addEventListener('mousemove', this.mouseMove.bind(this)); // Przekaż event 'mousemove' rodzica elementów canvas do metody mouseMove
        this.canvasOuter.addEventListener('mouseup', this.mouseDisable.bind(this)); // Przekaż event 'mouseup' rodzica elementów canvas do metody mouseDisable
        this.canvasOuter.addEventListener('mousedown', this.mouseEnable.bind(this)); // Przekaż event 'mousedown' rodzica elementów canvas do metody mouseEnable

        document.addEventListener('paste', this.paste.bind(this)); // Przekaż event 'paste' do metody paste

        document.addEventListener('keydown', this.setString.bind(this)); // Przekaż event 'keydown' do metody setString

        this.btns.forEach(el => { // Dla wszystkich przycisków z menu:
            el.addEventListener('click', e => { // Dodaj event click:
                this.setMode(e.currentTarget.dataset.for); // Po kliknięciu wywołaj metodę setMode z parametrem mode = atrybutowi data-for
            });
        }, this); // endforeach
    },

    /**
     * Obsługuje zmianę rozmiaru pędzla.
     * @constructor
     * @param {event} e - Zdarzenie
     */
    changeSize: function (e) {
        this.menu.sizeVal.innerText = e.target.value; // Wyświetl wartość zdarzenia
        this.ctx.lineWidth = e.target.value; // Ustaw szerokość linii na wartość zdarzenia
        this.ctxHelper.lineWidth = e.target.value; // Ustaw szerokość linii pomocniczego canvas'a na wartość zdarzenia
    },

    /**
     * Obsługuje zmianę rozmiaru wklejanego zdjęcia.
     * @constructor
     * @param {event} e - Zdarzenie
     */
    changeImgSize: function (e) {
        this.menu.imgSizeVal.innerText = e.target.value; // Wyświetl wartość zdarzenia

        if (this.checkImage()) { // Jeżeli załadowany został obrazek
            this.ctxHelper.clearRect(0, 0, this.canvasHelper.width, this.canvasHelper.height); // Wyczyść pomocniczy canvas
            this.ctxHelper.drawImage(this.pastedImage, this.imgX, this.imgY, this.imgWidth * parseFloat(this.menu.imgSize.value), this.imgHeight * parseFloat(this.menu.imgSize.value)); // Narysuj obrazek na pomocniczym canvasie

            this.ctxHelper.beginPath(); // Rozpocznij scieżkę
            this.ctxHelper.rect(this.imgX, this.imgY, this.imgWidth * parseFloat(this.menu.imgSize.value), this.imgHeight * parseFloat(this.menu.imgSize.value)); // Utwórz prostokąt wokół zdjęcia
            this.ctxHelper.closePath(); // Zakończ ścieżkę
            this.ctxHelper.stroke(); // Namaluj ścieżkę
        } //endif
    },

    /**
     * Obsługuje zmianę koloru.
     * @constructor
     * @param {event} e - Zdarzenie
     * @param {boolean} directValue - Bezpośrednia wartość
     */
    changeColor: function (e, directValue) {
        directValue = typeof directValue === 'undefined' ? false : directValue; // Jeżeli nie został podany parametr directValue to ustaw go na false
        this.ctx.strokeStyle = directValue ? e : e.target.value; // Ustawia kolor pędzla na directValue lub wartość zdarzenia
        this.ctxHelper.strokeStyle = directValue ? e : e.target.value; // Ustawia kolor pędzla w pomocniczym canvasie na directValue lub wartość zdarzenia
    },

    /**
     * Obsługuje ruch myszy.
     * @constructor
     * @param {event} e - Zdarzenie
     */
    mouseMove: function (e) {
        if (this.canDraw) { // Jeżeli można rysować:
            const mousePos = this.getMousePos(e); // zapisz pozycję myszy do stałej mousePos

            switch (this.mode) { // Switch dla obecnego trybu:
                case 'draw': // Jeżeli tryb draw
                    this.ctx.lineTo(mousePos.x, mousePos.y); // Utwórz linię do pozycji myszy
                    this.ctx.stroke(); // Maluj
                    break; // break
                case 'rubber': // Jeżeli tryb rubber
                    const width = (0.5 * this.menu.size.value); // Ustaw stałą szerokość na pół rozmiaru pędzla
                    this.ctx.clearRect(parseInt(mousePos.x - width, 10), parseInt(mousePos.y - width, 10), width, width); // Wyczyść obraz w miejscu myszy
                    break; // break
                case 'line': // Jeżeli tryb line
                    this.ctxHelper.clearRect(0, 0, this.canvasHelper.width, this.canvasHelper.height); // Wyczyść pomocniczy canvas
                    this.ctxHelper.beginPath(); // Rozpocznij ścieżkę
                    this.ctxHelper.moveTo(this.startX, this.startY); // Przejdź do początkowych kordynatów myszy
                    this.ctxHelper.lineTo(mousePos.x, mousePos.y); // Poprowadź linię do obecnej pozycji myszy
                    this.ctxHelper.closePath(); // Zamknij ścieżkę
                    this.ctxHelper.stroke(); // Maluj
                    break; // break
                case 'rect': // Jeżeli tryb rect
                    this.ctxHelper.clearRect(0, 0, this.canvasHelper.width, this.canvasHelper.height); // Wyczyść pomocniczy canvas
                    this.ctxHelper.beginPath(); // Rozpocznij ścieżkę
                    this.ctxHelper.moveTo(this.startX, this.startY); // Przejdź do początkowych kordynatów myszy
                    this.ctxHelper.rect(this.startX, this.startY, mousePos.x - this.startX, mousePos.y - this.startY); // Utwórz prostoką†
                    this.ctxHelper.closePath(); // Zamknij ścieżkę
                    this.ctxHelper.stroke(); // Maluj
                    break; // break
                case 'mark':  // Jeżeli tryb mark
                    this.ctxHelper.clearRect(0, 0, this.canvasHelper.width, this.canvasHelper.height); // Wyczyść pomocniczy canvas
                    this.ctxHelper.beginPath(); // Rozpocznij ścieżkę
                    this.ctxHelper.moveTo(this.startX, this.startY); // Przejdź do początkowych koordynaty myszy
                    this.ctxHelper.rect(this.startX, this.startY, mousePos.x - this.startX, mousePos.y - this.startY); // Utwórz prostokąt
                    this.ctxHelper.closePath(); // Zamknij ścieżkę
                    this.ctxHelper.stroke(); // Maluj
                    this.setMark(this.startX, this.startY, mousePos.x - this.startX, mousePos.y - this.startY); // Ustaw koordynaty zaznaczenia
                    break; // break
                case 'circle': // Jeżeli tryb circle
                    this.ctxHelper.clearRect(0, 0, this.canvasHelper.width, this.canvasHelper.height); // Wyczyść pomocniczy canvas
                    this.ctxHelper.beginPath(); // Rozpocznij ścieżkę
                    this.ctxHelper.arc(this.startX, this.startY, Math.abs(mousePos.x - this.startX), 0, 2 * Math.PI); // Utwórz okrąg
                    this.ctxHelper.closePath(); // Zamknij ścieżkę
                    this.ctxHelper.stroke(); // Maluj
                    break; // break
                case 'image': // Jeżeli tryb image
                    if (this.checkImage()) {
                        const w = this.imgWidth * parseFloat(this.menu.imgSize.value); // Ustaw stałą w na szerokość zdjęcia * skala
                        const h = this.imgHeight * parseFloat(this.menu.imgSize.value); // Ustaw stałą h na wysokość zdjęcia * skala
                        this.ctxHelper.clearRect(0, 0, this.canvasHelper.width, this.canvasHelper.height); // Wyczyść pomocniczy canvas
                        this.ctxHelper.drawImage(this.pastedImage, mousePos.x - (0.5 * w), mousePos.y - (0.5 * h), w, h); // Narysuj zdjęcie na pomocniczym canvasie
                        this.imgX = mousePos.x - (0.5 * w); // Ustaw pozycję X zdjęćia
                        this.imgY = mousePos.y - (0.5 * h); // Ustaw pozycję Y zdjęćia

                        this.ctxHelper.beginPath(); // Rozpocznij ścieżkę
                        this.ctxHelper.rect(mousePos.x - (0.5 * w), mousePos.y - (0.5 * h), w, h); // Utwórz prostokąt wokół zdjęcia
                        this.ctxHelper.closePath(); // Zamknij ścieżkę
                        this.ctxHelper.stroke(); // Maluj
                    }
                    break; // break
                default: // domyślnie:
                    break; // break
            }
        }

    },

    /**
     * Obsługuje koniec kliknięcia myszy.
     * @constructor
     * @param {event} e - Zdarzenie
     */
    mouseDisable: function (e) {
        this.canDraw = false; // Zablokuj rysowanie

        if (this.mode === 'line' || this.mode === 'rect' || this.mode === 'circle') { // Jeżeli mode jest równy line lub rect lub circle to:
            this.ctx.drawImage(this.canvasHelper, 0, 0); // Przenieś canvas pomocniczy na główny
            this.ctxHelper.clearRect(0, 0, this.canvasHelper.width, this.canvasHelper.height); // Wyczyść canvas pomocniczy
        }
    },

    /**
     * Obsługuje początek kliknięcia myszy.
     * @constructor
     * @param {event} e - Zdarzenie
     */
    mouseEnable: function (e) {
        this.canDraw = true; // Odblokuj rysowanie

        const mousePos = this.getMousePos(e); // Zapisz pozycję myszy do stałej mousePos
        this.startX = mousePos.x; // Ustaw wartość X startowej pozycji myszy
        this.startY = mousePos.y; // Ustaw wartość Y startowej pozycji myszy

        if (this.mode === 'text') { // Jeżeli mode == 'text' to:
            this.enableKeyboard = true; // Zezwól na używanie klawiatury
            this.keyboardText = ''; // Zresetuj wartość wpisywanego string'a
        }
        else if (this.mode === 'pipette') { // Jeżeli mode == 'pipette' to:
            const p = this.ctx.getImageData(this.startX, this.startY, 1, 1).data; // Zapisz wartość koloru klikniętego pixela do stałej p
            this.menu.color.value = "#" + ("000000" + this.rgbToHex(p[0], p[1], p[2])).slice(-6); // Ustaw wartość koloru w menu na wartość ze stałej p

            this.changeColor(this.menu.color.value, true); // Zmień kolor
        }
        else if (this.mode === 'paint') { // Jeżeli mode == 'paint' to:
            this.paint(this.startX, this.startY, this.ctx.getImageData(this.startX, this.startY, 1, 1).data); // Wypełnij obszar kolorem
        }
        else { // else:
            this.ctx.beginPath(); // Rozpocznij ścieżkę
            this.ctx.moveTo(this.startX, this.startY); // Przesuń do kliknietego punktu
        } //endif
    },

    /**
     * Obsługuje wpisywanie z klawiatury.
     * @constructor
     * @param {event} e - Zdarzenie
     */
    setString: function (e) {
        if (this.enableKeyboard && this.allowedChars.includes(e.key)) { // Jeżeli można pisać i kliknięty klawisz jest dozwolony to:
            this.keyboardText += (e.key != 'Enter' ? e.key : ' '); // Dodaj wartość klikniętego klawisza do string'a z tekstem
            this.ctxHelper.clearRect(0, 0, this.canvasHelper.width, this.canvasHelper.height); // Wyczyść pomocniczy canvas
            this.ctxHelper.fillText(this.keyboardText, this.startX, this.startY); // Wyświetl tekst ze string'a
            if (e.keyCode == 32 && e.target == document.body) { // Wyłącz scrollowanie strony za pomocą spacji
                e.preventDefault(); // Zresetuj event
            } // endif
        }
    },

    /**
     * Zwraca pozycję myszy.
     * @constructor
     * @param {event} e - Zdarzenie
     * @returns {object} Zwraca obiekt z pozycją myszy
     */
    getMousePos: function (e) {
        return {
            x: (e.pageX - this.getElementPos(this.canvas).left), // Ustaw zmienną x
            y: (e.pageY - this.getElementPos(this.canvas).top), // Ustaw zmienną y
        };
    },

    /**
     * Zwraca pozycję elementu.
     * @constructor
     * @param {object} obj - Element
     * @returns {object} Zwraca obiekt z pozycją elementu
     */
    getElementPos: function (obj) {
        let top = 0; // Niech top = 0
        let left = 0; // Niech left = 0
        while (obj && obj.tagName != "BODY") { // Dopóki element istnieje i nie ma tagu 'body':
            top += obj.offsetTop - obj.scrollTop; // Dodaj do top różnicę pozycji górnej i scroll'a pionowego
            left += obj.offsetLeft - obj.scrollLeft; // Dodaj do top różnicę pozycji lewej i scroll'a poziomego
            obj = obj.offsetParent; // Ustaw obiekt na jego rodzica
        }
        return { // Zwróć
            top: top, // pozycję top
            left: left // pozycję left
        };
    },

    /**
     * Zamienia kolor z formatu rgb do hex.
     * @constructor
     * @param {number} r - Wartość RED koloru
     * @param {number} g - Wartość GREEN koloru
     * @param {number} b - Wartość BLUE koloru
     * @returns {string} Zwraca kolor w formacie hex
     */
    rgbToHex: function (r, g, b) {
        if (r > 255 || g > 255 || b > 255) throw "Błędny kolor"; // Jeżeli błędne parametry to zwróć błąd
        return ((r << 16) | (g << 8) | b).toString(16); // Zamiana formatu koloru
    },

    /**
     * Zamienia kolor z formatu hex do rgb.
     * @constructor
     * @param {string} hex - Wartość hex koloru
     * @returns {{null|object} Zwraca kolor w formacie rgb lub nic
     */
    hexToRgb: function (hex) {
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i; // Ustawia odpowiedni regex
        hex = hex.replace(shorthandRegex, function (m, r, g, b) { // Zamienia hex z użyciem regex'a
            return r + r + g + g + b + b;
        });

        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); // Ustawia wynik na wartość rgb
        return result ? { // Jeżeli result jest ustawiony to zwróć
            r: parseInt(result[1], 16), // r
            g: parseInt(result[2], 16), // g
            b: parseInt(result[3], 16) // b
        } : null; // w przeciwnym razie null
    },

    /**
     * Metoda wypełnienia obszaru kolorem.
     * @constructor
     * @param {number} x - Współrzędna x
     * @param {number} y - Współrzędna y
     * @param {array} oldColor - Wartość poprzedniego koloru
     */
    paint: function (x, y, oldColor) {
        let points = []; // Ustaw tablicę punktów
        let point; // Ustaw zmienną dla obecnego punktu
        points.push({ // Dodaj do tablicy punktów punkt o współrzędnych:
            x: x, // podany parametr x
            y: y // podany parametr y
        });
        let imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height); // Pobierz wszystkie pixele obrazu
        const width = this.canvas.width; // pobierz szerokość obrazu
        const newColor = this.hexToRgb(this.menu.color.value); // pobierz nowy kolor do ustawienia
        while (points.length) { // Dopóki tablica punktów nie jest pusta:
            point = points.pop(); // Wyciągnij punkt z konca tablicy
            if (imageData.data[(point.y * width + point.x) * 4 + 0] == oldColor[0] &&
                imageData.data[(point.y * width + point.x) * 4 + 1] == oldColor[1] &&
                imageData.data[(point.y * width + point.x) * 4 + 2] == oldColor[2]) { // Jeżeli kolor pobranego punktu to stary kolor to:
                /* Zmień kolor na nowy: */
                imageData.data[(point.y * width + point.x) * 4 + 0] = newColor.r;
                imageData.data[(point.y * width + point.x) * 4 + 1] = newColor.g;
                imageData.data[(point.y * width + point.x) * 4 + 2] = newColor.b;

                /* Dodaj do tablicy punktów punkt po prawej */
                points.push({
                    x: point.x + 1,
                    y: point.y,
                });
                /* Dodaj do tablicy punktów punkt po lewej */
                points.push({
                    x: point.x - 1,
                    y: point.y,
                });
                /* Dodaj do tablicy punktów punkt na górze */
                points.push({
                    x: point.x,
                    y: point.y + 1,
                });
                /* Dodaj do tablicy punktów punkt na dole */
                points.push({
                    x: point.x,
                    y: point.y - 1,
                });
            }
        }
        this.ctx.putImageData(imageData, 0, 0); // Wypełnij canvas nowymi wartościami pixeli
    },

    /**
     * Obsługuje użycie 'wklej'.
     * @constructor
     * @param {event} e - Zdarzenie
     * @returns {(boolean|void)} Zwraca false lub nic
     */
    paste: function (e) {
        if (e.clipboardData) { // Jeżeli w zdarzeniu jest zawartość schowka
            let items = e.clipboardData.items; // Pobierz zawartość schowka
            if (!items) { // Jeżeli brak zawartości to:
                return false; // Zwróć false
            }

            for (let i = 0; i < items.length; i++) { // Pętla dla wszystkich elementów:
                if (items[i].type.indexOf('image') !== -1) { // Jeżeli znaleziono obrazek:
                    var blob = items[i].getAsFile(); // Pobierz obraz jako blob
                    var URLObj = window.URL || window.webkitURL; // ustaw obecny adres url
                    var source = URLObj.createObjectURL(blob); // Stwórz adres url z użyciem blob
                    this.pasteImage(source); // Wklej obrazek z utworzonego adresu url
                }
            }

            e.preventDefault(); // Zrezetuj event
        }
    },

    /**
     * Obsługuje wklejanie obrazka.
     * @constructor
     * @param {string} source - Link z obrazkiem
     */
    pasteImage: function (source) {
        this.pastedImage = new Image(); // Utwórz obrazek
        this.pastedImage.addEventListener('load', function () { // Po załądowaniu obrazka:
            this.setImageSize(this.pastedImage.naturalWidth, this.pastedImage.naturalHeight); // Ustaw rozmiar obrazka
            this.ctxHelper.clearRect(0, 0, this.canvasHelper.width, this.canvasHelper.height); // Wyczyść canvas pomocniczy
            this.ctxHelper.drawImage(this.pastedImage, 0, 0, this.imgWidth * parseFloat(this.menu.imgSize.value), this.imgHeight * parseFloat(this.menu.imgSize.value)); // Narysuj obrazek na canvasie pomocniczym
            this.ctxHelper.beginPath(); // Rozpocznij ścieżkę
            this.ctxHelper.rect(0, 0, this.imgWidth * parseFloat(this.menu.imgSize.value), this.imgHeight * parseFloat(this.menu.imgSize.value)); // Narysuj prostokąt wokół obrazka
            this.ctxHelper.closePath(); // Zamknij ścieżkę
            this.ctxHelper.stroke(); // Rysuj
            this.setMode('image'); // Ustaw tryb na 'image'
        }.bind(this));
        this.pastedImage.src = source; // Ustaw link obrazka na podany source
    },

    /**
     * Ustawia rozmiar obrazka.
     * @constructor
     * @param {number} w - Szerokość obrazka
     * @param {number} h - Wysokość obrazka
     */
    setImageSize: function (w, h) {
        if (typeof w === 'undefined' || typeof h === 'undefined') { // Jeżeli nie zostały podane wszystkie parametry:
            this.imgWidth = -1; // Resetuj szerokość
            this.imgHeight = -1; // Resetuj wysokość
            this.imgX = -1; // Resetuj współrzędną X
            this.imgY = -1; // Resetuj współrzędną y
        } else { //else
            this.imgWidth = w; // Ustaw szerokość
            this.imgHeight = h; // Ustaw wysokość
            this.imgX = 0; // Ustaw współrzędną X na 0
            this.imgY = 0; // Ustaw współrzędną Y na 0
        } // endif
    },

    /**
     * Sprawdza czy mamy załadowany obrazek.
     * @constructor
     * @returns {boolean} Zwraca true lub false
     */
    checkImage: function () {
        return (this.pastedImage !== false && this.imgWidth !== -1 && this.imgHeight !== -1);
    },

    /**
     * Obsługuje wklejanie obrazka do głównego canvasa.
     */
    pasteImageToMainCanvas: function () {
        if (this.checkImage()) { // Jeżeli jest obrazek to:
            this.ctxHelper.clearRect(0, 0, this.canvasHelper.width, this.canvasHelper.height); // Wyczyść pomocniczy canvas
            this.ctxHelper.drawImage(this.pastedImage, this.imgX, this.imgY, this.imgWidth * parseFloat(this.menu.imgSize.value), this.imgHeight * parseFloat(this.menu.imgSize.value)); // Pokaż obrazek na pomocniczym canvasie

            this.ctx.drawImage(this.canvasHelper, 0, 0); // Przerysuj pomocniczy canvas na główny canvas
            this.ctxHelper.clearRect(0, 0, this.canvasHelper.width, this.canvasHelper.height); // Wyczyść pomocniczy canvas

            this.setImageSize(); // Zresetuj rozmiary obrazka
            this.pastedImage = false; // Zresetuj wklejony obrazek
        }
    },

    /**
     * Ustawia zaznaczenie.
     * @constructor
     * @param {number} sX - startowy X
     * @param {number} sY - startowy Y
     * @param {number} eX - końcowy X
     * @param {number} eY - końcowy Y
     */
    setMark: function (sX, sY, eX, eY) {
        this.mark.startX = sX; // Ustaw startowy X
        this.mark.startY = sY; // Ustaw startowy Y
        this.mark.endX = eX; // Ustaw końcowy X
        this.mark.endY = eY; // Ustaw końcowy Y
    },

    /**
     * Metoda animacji sceny dla canvasu 3d.
     * @constructor
     */
    animate: function () {
        this.animationID = requestAnimationFrame(this.animate.bind(this)); // Ustaw pętlę animacji
        this.mesh.position.set(this.position.x, this.position.y, this.position.z); // Ustaw pozycję obiektu zgodnie z zapisanymi wartościami
        this.controls.update(); // Zaktualizuj układ sterowania
        this.renderer.render(this.scene, this.camera); // Renderuj obiekty na scenie
    },

    /**
     * Ustawia canvas 3d.
     * @constructor
     * @param {string} geo - Wybrany rodzaj figury
     */
    init3d: function (geo) {
        this.camera = new THREE.PerspectiveCamera(70, this.canvas.width / this.canvas.height, 1, 1000); // Utwórz kamerę
        this.camera.position.z = 400; // Ustaw pozycję kamery
        this.scene = new THREE.Scene(); // Utwórz scenę
        const texture = new THREE.TextureLoader().load('images/crate.gif'); // Ustaw teksturę z pliku

        let geometry; // Utwórz zmienną na obiekty

        switch (geo) { // Switch dla wybranego rodzaju figury
            case 'cone':
                geometry = new THREE.ConeGeometry(50, 200, 32); // Ustaw figurę na Cone
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(50, 50, 200, 32); // Ustaw figurę na Cylinder
                break;
            case 'octahedron':
                geometry = new THREE.OctahedronGeometry(100, 0); // Ustaw figurę na octahedron
                break;
            case 'heart':
                var heartShape = new THREE.Shape();  // Utwórz kształt

                /* Tworzenia kształtu za pomocą linii */
                let x = 0;
                let y = 0;
                heartShape.moveTo(x + 50, y + 50);
                heartShape.bezierCurveTo(x + 50, y + 50, x + 40, y, x, y);
                heartShape.bezierCurveTo(x - 60, y, x - 60, y + 70, x - 60, y + 70);
                heartShape.bezierCurveTo(x - 60, y + 110, x - 30, y + 154, x + 50, y + 190);
                heartShape.bezierCurveTo(x + 120, y + 154, x + 160, y + 110, x + 160, y + 70);
                heartShape.bezierCurveTo(x + 160, y + 70, x + 160, y, x + 100, y);
                heartShape.bezierCurveTo(x + 70, y, x + 50, y + 50, x + 50, y + 50);
                /* Koniec tworzenia kształtu */

                geometry = new THREE.ShapeGeometry(heartShape); // Ustaw figurę ze kształtu
                break;
            case 'cube':
            default:
                geometry = new THREE.BoxBufferGeometry(200, 200, 200); // Ustaw figurę na cube
                break;
        }

        let material = new THREE.MeshBasicMaterial({map: texture}); // Utwórz materiał z tekstury
        this.mesh = new THREE.Mesh(geometry, material); // Utwórz siatkę z kształtu
        this.scene.add(this.mesh); // Dodaj siatkę na scenę
        this.scene.updateMatrixWorld(true); // Pozwól na zmianę obiektów
        this.position = new THREE.Vector3(); // Utwórz vektor dla pozycji
        this.position.getPositionFromMatrix(this.mesh.matrixWorld); // Pobierz pozycję

        this.renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true, alpha: true}); // Utwórz render
        this.renderer.setPixelRatio(window.devicePixelRatio); // Ustaw stosunek pixeli
        this.renderer.setSize(this.canvas.width, this.canvas.height); // Ustaw rozmiar
        this.renderer.domElement.classList.add('canvas-3d'); // Dodaj klasę dla canvasu 3d
        if (!(document.querySelector('.canvas .canvas-3d'))) // Jeżeli canvas 3d nie został dodany do dokumentu to:
            this.canvasOuter.appendChild(this.renderer.domElement); // Dodaj canvas 3d do dokumentu
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement); // Ustaw układ sterowania
        this.canvas3d = document.querySelector('.canvas .canvas-3d'); // Zapisz element canvas 3d do zmiennej canvas3d

        this.animate(); // Wywołaj animację
    },

    /**
     * Konstruktor obiektu Paint.
     * @constructor
     */
    init: function () {
        this.canvasOuter = document.querySelector('.canvas'); // Ustawia rodzica elementu canvas

        this.canvas = this.createCanvas(); // Tworzy główny canvas
        this.canvasOuter.appendChild(this.canvas); // Dodaje główny canvas do dokumentu
        this.ctx = this.canvas.getContext('2d'); // Ustawia context głównego canvasu
        this.ctx.fillStyle = "#fff"; // Ustawia wypełnienie canvasu na białe
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); // Wypełnia główny canvas białym kolorem

        this.canvasHelper = this.createCanvas(); // Tworzy canvas pomocniczy
        this.canvasOuter.appendChild(this.canvasHelper); // Dodaje canvas pomocniczy do dokumentu
        this.ctxHelper = this.canvasHelper.getContext('2d'); // Ustawia context pomocniczego canvasu


        this.menu = { // Ustawia elementy menu
            size: document.querySelector('.km-paint input[type="range"].range-size'), // element rozmiaru
            sizeVal: document.querySelector('.km-paint output.size'), // element wyświetlania rozmiaru
            imgSize: document.querySelector('.km-paint input[type="range"].range-img-size'), // element rozmiaru obrazu
            imgSizeVal: document.querySelector('.km-paint output.img_size'), // element wyświetlania rozmiaru obrazu
            color: document.querySelector('.km-paint input[type="color"]'), // element koloru
        };

        this.menu.sizeVal.innerText = this.menu.size.value; // ustawia wyświetlanie rozmiaru
        this.menu.imgSizeVal.innerText = this.menu.imgSize.value; // ustawia wyświetlanie rozmiaru obrazu

        this.mark = { // Ustawia początkowe wartości zaznaczenia
            startX: 0, // startowa współrzedna X = 0
            startY: 0, // startowa współrzedna Y = 0
            endX: 0, // końcowa współrzedna X = 0
            endY: 0 // końcowa współrzedna Y = 0
        };

        this.enableKeyboard = false; // wyłącza obsługę klawiatury
        this.keyboardText = ''; // ustawia początkowy string wpisany z klawiatury na pusty
        this.allowedChars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'r', 's', 't', 'u', 'w', 'x', 'y', 'z', 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, ' ', 'Enter']; // tablica dozwoonych znaków

        this.btns = [].slice.call(document.querySelectorAll('.km-paint button, .km-paint .button')); // ustawia tablicę buttonów

        this.modes = ['draw', 'line', 'rect', 'circle', 'paint', 'image', 'delete', 'save', 'mark', 'pipette', 'rubber', 'text', 'cube', 'cone', 'cylinder', 'octahedron', 'heart']; // tablica dozwolonych trybów
        this.models3d = ['cube', 'cone', 'cylinder', 'octahedron', 'heart']; // tablica modeli 3d
        this.canDraw = false; // wyłącza rysowanie

        this.setMode(); // Ustawia początkowy tryb pracy programu

        this.initSets(); // Ustawia wartości początkowe głównego canvasu
        this.initSets(this.ctxHelper); // Ustawia wartości początkowe pomocniczego canvasu

        this.setEvents(); // Ustawia zdarzenia

        this.imgWidth = -1;  // Resetuje szerokość obrazu
        this.imgHeight = -1;  // Resetuje wysokość obrazu
        this.pastedImage = false; // Resetuje wklejony obraz
        this.imgX = -1; // Resetuje współrzędną X obrazu
        this.imgY = -1; // Resetuje współrzędną Y obrazu
    }
}

paint.init(); // Wywołanie programu