(function(global, factory) {
    (global = global || self, factory(global));
}(this, (function(exports) {
    'use strict';

    CheckerBoard.prototype.printLinePDF = function({ x1, y1, x2, y2, color, lineWidth }, doc, scale) {
        doc.setLineWidth(~~(lineWidth * scale + 1));
        doc.setDrawColor(color);
        doc.line(~~(x1 * scale + this.pdfOriginPoint.x), ~~(y1 * scale + this.pdfOriginPoint.y), ~~(x2 * scale + this.pdfOriginPoint.x), ~~(y2 * scale + this.pdfOriginPoint.y));
    }
    
    CheckerBoard.prototype.printCirclePDF = function({ x, y, radius, color, lineWidth, fill }, doc, scale) {
        doc.setLineWidth(~~(lineWidth * scale + 1));
        doc.setDrawColor(color);
        doc.setFillColor(fill);
        doc.circle(~~(x * scale + this.pdfOriginPoint.x), ~~(y * scale + this.pdfOriginPoint.y), ~~(radius * scale), lineWidth ? "DF" : "F");
    }
    
    CheckerBoard.prototype.printTextPDF = function({ txt, x, y, color, weight, family, size }, doc, scale) {
        let fontName_normal = "PFSCMedium", //"arial";
            fontName_bold = "PFSCHeavy"; //"arial";
        txt = txt.split("").map(char => char == EMOJI_FOUL ? "×" : char).join("")
        doc.setTextColor(color);
        doc.setFont(weight == "900" ? fontName_bold : fontName_normal, "normal", "normal");
        doc.setFontSize(~~(size * scale));
        doc.text(txt, ~~(x * scale + this.pdfOriginPoint.x), ~~(y * scale + this.pdfOriginPoint.y), { baseline: "middle", align: "center" });
    }
    
    CheckerBoard.prototype.printTrianglePDF = function({ points, color }, doc, scale) {
        let x1 = ~~(points[0].x * scale + this.pdfOriginPoint.x),
            y1 = ~~(points[0].y * scale + this.pdfOriginPoint.y),
            x2 = ~~(points[1].x * scale + this.pdfOriginPoint.x),
            y2 = ~~(points[1].y * scale + this.pdfOriginPoint.y),
            x3 = ~~(points[2].x * scale + this.pdfOriginPoint.x),
            y3 = ~~(points[2].y * scale + this.pdfOriginPoint.y);
        doc.setFillColor(color);
        doc.triangle(x1, y1, x2, y2, x3, y3, 'F');
    }
    
    CheckerBoard.prototype.printBoardPointsPDF = function(doc, scale) {
        for (let i = 0; i < 225; i++) {
            if (this.P[i].type != TYPE_EMPTY) {
                let pointInfo = this.getBoardPointInfo(i, this.isShowNum);
                this.printCirclePDF(pointInfo.circle, doc, scale);
                this.printTextPDF(pointInfo.text, doc, scale);
            }
        }
    }
    
    CheckerBoard.prototype.printMarkLinesPDF = function(doc, scale, lines = this.lines) {
        let x1, x2, y1, y2;
        for (let i = 0; i < lines.length; i++) {
            let points = this.getMarkLinePoints(lines[i]);
            x1 = points.line[0].x;
            x2 = points.line[1].x;
            y1 = points.line[0].y;
            y2 = points.line[1].y;
            this.printLinePDF({ x1: x1, y1: y1, x2: x2, y2: y2, color: lines[i].color, lineWidth: ~~this.getMarkLineWidth() }, doc, scale);
        }
    }
    
    CheckerBoard.prototype.printMarkArrowsPDF = function(doc, scale, arrows = this.arrows) {
        let x1, x2, y1, y2;
        for (let i = 0; i < arrows.length; i++) {
            let points = this.getMarkArrowPoints(arrows[i]);
            x1 = points.line[0].x;
            x2 = points.line[1].x;
            y1 = points.line[0].y;
            y2 = points.line[1].y;
            this.printLinePDF({ x1: x1, y1: y1, x2: x2, y2: y2, color: arrows[i].color, lineWidth: ~~this.getMarkLineWidth() }, doc, scale);
            this.printTrianglePDF({ points: points.arrow, color: arrows[i].color }, doc, scale);
        }
    }
    
    CheckerBoard.prototype.printEmptyCBoardPDF = function(doc, scale) {
        let boardLinesInfo = this.getBoardLinesInfo();
        boardLinesInfo.map(lineInfo => this.printLinePDF(lineInfo, doc, scale))
        let starPointsInfo = this.getStarPointsInfo();
        starPointsInfo.map(starPointInfo => this.printCirclePDF(starPointInfo, doc, scale))
        let coordinateTypeInfo = this.getCoordinateInfo();
        coordinateTypeInfo.map(textInfo => this.printTextPDF(textInfo, doc, scale))
    }
    
    CheckerBoard.prototype.refreshCheckerBoardPDF = function(doc, scale) {
        this.printEmptyCBoardPDF(doc, scale);
        this.printMarkLinesPDF(doc, scale);
        this.printBoardPointsPDF(doc, scale);
        this.printMarkArrowsPDF(doc, scale);
    }
    
    // 棋盘保存PDF文件
    CheckerBoard.prototype.saveAsPDF = function(fontName) {
        if (!("jsPDF" in self) || typeof jsPDF != "function") {
            warn(`${EMOJI_FOUL_THREE}缺少 jsPDF 插件`);
            return;
        }
        const oldTheme = this.theme;
        this.loadTheme(this.defaultTheme);
        
        //新建文档
        let doc = new jsPDF("p", "pt", "a4"); // 594.3pt*840.51pt
        this.pdfOriginPoint = {
            x: 594 * 0.0252525,
            y: (840 - (594 - 594 * 0.0252525 * 2)) / 2
        };
        let scale = (594 - 594 * 0.0252525 * 2) / this.canvas.width;
        this.refreshCheckerBoardPDF(doc, scale);
        let filename = this.autoFileName();
        doc.save(filename + ".pdf"); //保存文档
        
        this.loadTheme(oldTheme);
    };
})))
