"use strict";

(async () => {
	window.SOURCE_FILES = await loadJSON("Version/SOURCE_FILES.json");

	window.appSources = [
		{
			progress: "50%",
			type: "scriptAll",
			isAsync: false,
			sources: [[SOURCE_FILES["Button"]],
				[SOURCE_FILES["msgbox"]],
				[SOURCE_FILES["CheckerBoard"]],
				[SOURCE_FILES["image2board"]]]
         },{
			progress: "60%",
			type: "scriptAll",
			isAsync: false,
			sources: [[SOURCE_FILES["pdfjs"]],
				[SOURCE_FILES["mypdfjs"]]]
		}, {
			progress: "80%",
			type: "scriptAll",
			isAsync: false,
			sources: [[SOURCE_FILES["jszip"]],
            	[SOURCE_FILES["myZip_js"]]]
        }, {
			progress: "99%",
			type: "scriptAll",
			isAsync: false,
			sources: [[SOURCE_FILES["renjueditor"]],
				[SOURCE_FILES["renjueditorMain"]]]
        }
     ];
})()
    