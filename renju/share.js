
/*------ 分享图片窗口 ------*/
window.share = (() => {
        let sharing = false;

        let shareWindow = document.createElement("div");
        shareWindow.ontouch = function() { if (event) event.preventDefault(); };

        let imgWindow = document.createElement("div");
        imgWindow.ontouch = function() { if (event) event.preventDefault(); };
        shareWindow.appendChild(imgWindow);

        let shareLabel = document.createElement("div");
        imgWindow.appendChild(shareLabel);

        let checkDiv = document.createElement("div");
        imgWindow.appendChild(checkDiv);

        let checkbox = document.createElement("input");
        checkbox.setAttribute("type", "checkbox")
        checkDiv.appendChild(checkbox);

        let shareLabel2 = document.createElement("div");
        checkDiv.appendChild(shareLabel2);

        let shareImg = document.createElement("img");
        imgWindow.appendChild(shareImg);

        //取消按钮
        const ICO_DOWNLOAD = document.createElement("img");
        imgWindow.appendChild(ICO_DOWNLOAD);
        ICO_DOWNLOAD.src = "./pic/docusign-white.svg";
        ICO_DOWNLOAD.oncontextmenu = (event) => {
            event.preventDefault();
        };

        const ICO_CLOSE = document.createElement("img");
        imgWindow.appendChild(ICO_CLOSE);
        ICO_CLOSE.src = "./pic/close-white.svg";
        ICO_CLOSE.oncontextmenu = (event) => {
            event.preventDefault();
        };

        function refreshImg(backgroundColor, LbBackgroundColor) {
            cBoard.backgroundColor = backgroundColor;
            cBoard.LbBackgroundColor = LbBackgroundColor;
            cBoard.refreshCheckerBoard();
            shareImg.src = cBoard.cutViewBox().toDataURL();
        }

        function shareClose() {
            shareWindow.setAttribute("class", "hide");
            setTimeout(() => {
                shareWindow.parentNode.removeChild(shareWindow);
                sharing = false;
            }, ANIMATION_TIMEOUT);
        }

        return () => {
try{
            if (sharing) return;
            sharing = true;
            let oldBackgroundColor = cBoard.backgroundColor;
            let oldLbBackgroundColor = cBoard.LbBackgroundColor;

            let s = shareWindow.style;
            s.position = "fixed";
            s.zIndex = 9998;
            s.width = dw + "px";
            s.height = dh * 2 + "px";
            s.top = "0px";
            s.left = "0px";

            let imgWidth = dw < dh ? dw : dh;
            imgWidth = ~~(imgWidth * 3 / 4);
            s = imgWindow.style;
            s.position = "relative";
            s.width = imgWidth + "px";
            s.height = imgWidth + "px";
            s.top = ~~((dh - imgWidth) / 2) + "px";
            s.left = ~~((dw - imgWidth) / 2) + "px";
            s.backgroundColor = "#666666";
            s.border = `0px solid `;

            let iWidth = ~~(imgWidth * 3 / 5);
            s = shareImg.style;
            s.position = "absolute";
            s.width = iWidth + "px";
            s.height = iWidth + "px";
            s.top = ~~((imgWidth - iWidth) / 2) + "px";
            s.left = ~~((imgWidth - iWidth) / 2) + "px";
            s.border = `0px solid black`;

            let h = ~~((imgWidth - iWidth) / 2 / 2);
            let w = h * 4;
            let l = (imgWidth - w) / 2;
            let t = imgWidth - h - (imgWidth - iWidth) / 8;

            shareLabel.innerHTML = `<h1 style = "font-size: ${h*0.45}px;text-align: center;color:#f0f0f0">长按图片分享</h1>`;
            s = shareLabel.style;
            s.position = "absolute";
            s.width = w + "px";
            s.height = h + "px";
            s.top = (imgWidth - iWidth) / 8 + "px";
            s.left = l + "px";
            s.backgroundColor = imgWindow.style.backgroundColor || "#666666";

            s = checkDiv.style;
            s.position = "absolute";
            s.width = w / 2 + "px";
            s.height = h + "px";
            s.top = ~~((imgWidth - iWidth) / 2 - h) + "px";
            s.left = ~~((imgWidth - iWidth) / 2) + "px";

            s = checkbox.style;
            s.position = "absolute";
            s.width = h / 3 + "px";
            s.height = h / 3 + "px";
            s.top = h / 3 + "px";
            s.left = 0 + "px";
            checkbox.onclick = () => {
                if (checkbox.checked) refreshImg(oldBackgroundColor, oldLbBackgroundColor)
                else refreshImg("white", "white")
            };

            s = shareLabel2.style;
            s.position = "absolute";
            s.width = h + "px";
            s.height = h + "px";
            s.top = h / 3 + "px";
            s.left = h / 2 + "px";
            s.fontSize = h / 3 + "px";
            shareLabel2.innerHTML = `原图`;
            shareLabel2.onclick = () => checkbox.click()

            s = ICO_DOWNLOAD.style;
            s.position = "absolute";
            s.width = (imgWidth - parseInt(shareImg.style.top) - parseInt(shareImg.style.height)) / 2 + "px";
            s.height = s.width;
            s.top = imgWidth - parseInt(s.width) * 1.5 + "px";
            s.left = imgWidth / 2 - parseInt(s.width) * 1.5 + "px";
            s.backgroundColor = "#787878";
            s.opacity = "0.8";
            setButtonClick(ICO_DOWNLOAD, () => {
                cBoard.saveAsImage("png");
            });

            s = ICO_CLOSE.style;
            s.position = "absolute";
            s.width = ICO_DOWNLOAD.style.width;
            s.height = ICO_DOWNLOAD.style.height;
            s.top = ICO_DOWNLOAD.style.top;
            s.left = imgWidth / 2 + parseInt(s.width) * 0.5 + "px";
            s.backgroundColor = "#787878";
            s.opacity = "0.8";
            setButtonClick(ICO_CLOSE, () => {
                shareClose();
                if (cBoard.backgroundColor != oldBackgroundColor || cBoard.LbBackgroundColor != oldLbBackgroundColor) {
                    refreshImg(oldBackgroundColor, oldLbBackgroundColor);
                }
            });

            checkbox.onclick();
            shareWindow.setAttribute("class", "show");
            setTimeout(() => { document.body.appendChild(shareWindow); }, 1);
        }catch(e){alert(e.stack)}
        };
    })();
