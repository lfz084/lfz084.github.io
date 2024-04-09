try{
let loadTheme = function () {
	const defaultThemes = {
		"light": {
			"body": {
				"color": "#333333",
				"backgroundColor": "white"
			}
		},
		"grey": {
			"body": {
				"color": "#333333",
				"backgroundColor": "white"
			}
		},
		"green": {
			"body": {
				"color": "#333333",
				"backgroundColor": "#118800"
			}
		},
		"dark": {
			"body": {
				"color": "#d0d0d0",
				"backgroundColor": "#333333"
			}
		}
	}
	const themeKey = localStorage.getItem("theme") || "light";
	const themes = localStorage.getItem("themes") || defaultThemes;
	themes && themes[themeKey] && themes[themeKey]["body"] && Object.assign(document.body, themes[themeKey]["body"]);
}

loadTheme();

}catch(e){alert(e.stack)}
