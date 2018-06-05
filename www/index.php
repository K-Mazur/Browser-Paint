<!DOCTYPE html>
<html lang="pl">
<head>
	<title>Paint</title>
	<link rel="shortcut icon" href="images/favicon.png" type="image/png"/>
	<meta charset="UTF-8">
	<meta http-equiv="Content-type" content="text/html; charset=utf-8"/>
	<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
	<meta name="Description" content=""/>
	<meta name="Keywords" content=""/>
	<link type="text/css" href="css/general.css" rel="stylesheet">
<!--	<script src="//localhost:35729/livereload.js"></script>-->
</head>
<body>
<main>
	<div class="wrapper">
		<h1>Canvas Browser Paint</h1>
		<div class="km-paint">
			<div class="menu">
				<div class="options">
					<input type="color" id="color">
					<input type="range" id="size" min="1" max="100" value="2">
					<output for="size"></output>
				</div>
				<div class="buttons">
					<button type="button" data-for="draw"></button>
					<button type="button" data-for="line"></button>
					<button type="button" data-for="rect"></button>
					<button type="button" data-for="circle"></button>
					<button type="button" data-for="paint"></button>
					<button type="button" data-for="image"></button>
					<a href="#" class="button" download="image.png" data-for="save"></a>
					<button type="button" data-for="delete"></button>
				</div>
			</div>
			<div class="canvas">
			</div>
			<div class="instruction">
				<h3>Instrukcja:</h3>
				<p>
					Za pomocą kwadratu po lewej stronie menu możemy ustawiać kolor.
				</p>
				<p>
					Za pomocą paska po lewej stronie menu możemy zmieniać rozmiar pędzla.
				</p>
				<p>
					Ołówek - ustawia tryb rysowania ołówkiem.
				</p>
				<p>
					Linia - ustawia tryb rysowania linii.
				</p>
				<p>
					Kwadrat - ustawia tryb rysowania prostokątów.
				</p>
				<p>
					Koło - ustawia tryb rysowania okręgów.
				</p>
				<p>
					Kubeł z farbą - ustawia tryb wypełniania obszaru wybranym kolorem.
				</p>
				<p>
					Obrazek - aktywowany jest gdy w schowku mamy skopiowany obraz i użyjemy kombinacji klawiszy CTRL+V / CMD + V. Obrazek zostanie wklejony w osobnej warstwie, a jego pozycja zostanie zapisana po zmianie trybu na inny.
				</p>
				<p>
					Dyskietka - zapisuje namalowany obraz w formacie .png.
				</p>
				<p>
					Kosz - czyści cały obraz.
				</p>
			</div>
		</div>
	</div>
</main>

<script type="text/javascript" src="js/scripts.js"></script>
</body>
</html>