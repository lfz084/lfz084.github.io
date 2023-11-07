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
				[SOURCE_FILES["share"]],
				[SOURCE_FILES["CheckerBoard"]],
				[SOURCE_FILES["saveFile"]]]
         },{
			progress: "60%",
			type: "scriptAll",
			isAsync: false,
			sources: [[SOURCE_FILES["dbTypes"]],
				[SOURCE_FILES["dbclient"]]]
		}, {
			progress: "80%",
			type: "scriptAll",
			isAsync: false,
			sources: [[SOURCE_FILES["EvaluatorWebassembly"]],
                [SOURCE_FILES["EvaluatorJScript"]],
                [SOURCE_FILES["Evaluator"]]]
        }, {
			progress: "99%",
			type: "scriptAll",
			isAsync: false,
			sources: [[SOURCE_FILES["dbreadMain"]]]
        }
     ];
})()
