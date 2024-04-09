"use strict";
		
(async () => {
	window.SOURCE_FILES = await loadJSON("Version/SOURCE_FILES.json");

	window.appSources = [
		{
			progress: "99%",
			type: "scriptAll",
			isAsync: false,
			sources: [[SOURCE_FILES["resetMain"]]]
        }
     ];
})()
    