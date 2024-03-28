"use strict";
		
(async () => {
	window.SOURCE_FILES = await loadJSON("Version/SOURCE_FILES.json");

	window.appSources = [
		{
			progress: "50%",
			type: "scriptAll",
			isAsync: false,
			sources: [[SOURCE_FILES["msgbox"]],
				[SOURCE_FILES["share"]],
				[SOURCE_FILES["exWindow"]],
				[SOURCE_FILES["CheckerBoard"]],
                [SOURCE_FILES["InputButton"]]]
        }, {
			progress: "99%",
			type: "scriptAll",
			isAsync: false,
			sources: [[SOURCE_FILES["settingData"]],
                [SOURCE_FILES["setThemeMain"]]]
        }
     ];
})()
