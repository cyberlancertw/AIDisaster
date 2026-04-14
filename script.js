// 判斷是否捲到底的讀取中用變數
const config = {
    isPortrait: false,
    isProcessing: false,
    query: '',
    isFuzzy: false,
    page:{
        size: 20,
        index: 0,
    },
    cardWidth: 0
};
window.addEventListener('load', initializeBody);


/**
 * 圖片 DOM 的更新
 * @param {boolean} isClear true 表全部清除，false 往後補圖 
 * @param {string[]} ids 過濾且分頁後的 id 資料
 */
function appendCard(isClear, ids) {
    const divShow = document.getElementById('divShow');
    if (isClear) {
        divShow.innerHTML = '';
    }
    for (const id of ids) {
        const pic = document.createElement('div');
        const link = document.createElement('a');
        const wrap = document.createElement('div');
        const img = document.createElement('img');
        const path = `./image/${id}.png`;
        img.setAttribute('src', path);
        img.className = 'gallery-image';
        wrap.appendChild(img);
        wrap.className = 'gallery-wrap';
        link.setAttribute('href', path);
        //link.setAttribute('target', '_blank');
        link.className = 'gallery-link';
        link.appendChild(wrap);
        pic.className = 'gallery-pic';
        pic.appendChild(link);

        if (!config.isPortrait){
            img.addEventListener('load', calculateSpan);
        }
        divShow.appendChild(pic);
    }
}

/**
 * 圖片載完後，計算圖卡需要的高度
 */
function calculateSpan(){
    const h = this.naturalHeight, w = this.naturalWidth;
    const s = Math.ceil(((350 - 10 * 2) * h / w + 10 * 2 + 5) / 10);
    this.parentNode.parentNode.parentNode.style.gridRowEnd = `span ${s}`;
    this.removeEventListener('load', calculateSpan);
}

/**
 * 螢幕旋轉事件
 */
function changeScreenOrientation(){
    config.isPortrait = screen.orientation.type === 'portrait-primary' || screen.orientation.type === 'portrait-secondary';
    refreshData(true);
}

/**
 * 螢幕旋轉事件(過時)
 */
function changeWindowOrientation(){
    config.isPortrait = window.matchMedia('(orientation: portrait)').matches;
    refreshData(true);
}

/**
 * 不過濾只做分頁
 * @param {any[]} datas 
 * @param {number} skipCount 
 * @param {number} pageSize 
 * @returns {string[]}
 */
function filterAll(datas, skipCount, pageSize){
    let index = -1, count = 0;
    const result = [];
    for (const data of datas){
        index++;
        if (skipCount <= index){
            count++;
            result.push(data.id);

            if (pageSize === count){
                break;
            }
        }
    }
    return result;
}

/**
 * 非模糊查詢與分頁過濾
 * @param {any[]} datas 
 * @param {string[]} queryWords 
 * @param {number} skipCount 
 * @param {number} pageSize 
 * @returns {string[]}
 */
function filterAnd(datas, queryWords, skipCount, pageSize){
    let index = -1, count = 0;
    const result = [];
    for (const data of datas){
        let isMatch = true;
        for (const word of queryWords){
            if (!data.keyword.includes(word)){
                isMatch = false;
                break;
            }
        }
        if (isMatch){
            index++;
            if (skipCount <= index){
                count++;
                result.push(data.id);
                if (pageSize === count){
                    break;
                }
            }
        }
    }
    return result;
}

/**
 * 過濾處理
 * @param {any[]} datas 
 */
function filterData(datas){
    const pageIndex = config.page.index, pageSize = config.page.size, skipCount = pageIndex * pageSize;
    if (config.query.length > 0){
        const queryWords = config.query.split(' ');
        if (config.isFuzzy){
            return filterOr(datas, queryWords, skipCount, pageSize);
        }
        else{
            return filterAnd(datas, queryWords, skipCount, pageSize);
        }
    }
    else{
        return filterAll(datas, skipCount, pageSize);
    }
}

/**
 * 模糊查詢與分頁過濾
 * @param {any[]} datas 
 * @param {string[]} queryWords 
 * @param {number} skipCount 
 * @param {number} pageSize 
 * @returns {string[]}
 */
function filterOr(datas, queryWords, skipCount, pageSize){
    let index = -1, count = 0;
    const result = [];
    for (const data of datas){
        for (const word of queryWords){
            if (data.keyword.includes(word)){
                index++;
                if (skipCount <= index){
                    count++;
                    result.push(data.id);
                    if (pageSize === count){
                        break;
                    }
                }
            }
        }
    }
    return result;
}

/**
 * 取得圖片資料
 * @param {boolean} isClear true 表全部清除，false 往後補圖
 */
function getData(isClear) {
    if (isClear) {
        config.page.index = 0;
    }

    const dataVersion = document.getElementById('DataVersion').value;
    fetch(`./data.json?v=${dataVersion}`).then(response => response.json()).then(function (data) {
        setConfig();
        const ids = filterData(data);
        if (ids.length < config.page.size){
            config.page.index = -1;
        }
        else{
            config.page.index++;
        }
        appendCard(isClear, ids);
        switchEnable(true);
        config.isProcessing = false;
    });
}

/**
 * 元件到齊後的執行項目
 * */
function initializeBody() {
    config.cardWidth = parseInt(window.innerWidth / 4);
    
    if (screen.orientation){
        config.isPortrait = screen.orientation.type === 'portrait-primary' || screen.orientation.type === 'portrait-secondary';
        screen.orientation.addEventListener('change', changeScreenOrientation);
    }
    else if (window.orientation){
        config.isPortrait = window.matchMedia('(orientation: portrait)').matches;
        window.orientation.addEventListener('orientationChange', changeWindowOrientation);
    }
    else{
        config.isPortrait = window.matchMedia('(orientation: portrait)').matches;
        window.addEventListener('resize', resizeWindow);
    }
    window.addEventListener('scroll', scrollBody);
    document.getElementById('btnQuery').addEventListener('click', function () { refreshData(true); });
    document.getElementById('iptKeyword').addEventListener('keyup', pressKeyword);
    document.getElementById('chkFuzzy').addEventListener('change', function () { refreshData(true); });
    refreshData(true);
}

/**
 * 讓關鍵字文字框可按 Enter 做出查詢動作 
 * @param {any} e 按鍵事件
 */
function pressKeyword(e) {
    if (e.key == 'Enter') document.getElementById('btnQuery').click();    
}

/**
 * 更新圖片
 * @param {boolean} isClear true 表全部清除，false 往後補圖
 */
function refreshData(isClear) {
    switchEnable(false);
    getData(isClear);
}

/**
 * 視窗縮放的事件
 */
function resizeWindow(){
    const isPortraitNow = window.matchMedia('(orientation: portrait)').matches;
    if (config.isPortrait === isPortraitNow){
        return;
    }
    config.isPortrait = isPortraitNow;
    refreshData(true);
}

/**
 * 捲軸到底部用的事件
 */
function scrollBody() {
    if (document.body.scrollHeight - window.scrollY - document.body.clientHeight < 100) {
        if (config.isProcessing || config.page.index < 0){
            return;
        }
        config.isProcessing = true;
        refreshData(false);
    }
}

/**
 * 取關鍵字輸入框與是否模糊查詢
 */
function setConfig(){
    config.query = document.getElementById('iptKeyword').value.trim();
    config.isFuzzy = document.getElementById('chkFuzzy').checked;
}

/**
 * 開關元件
 * @param {boolean} isEnable true 可點選，false 鎖住
 */
function switchEnable(isEnable) {
    if (isEnable) {
        document.getElementById('btnQuery').removeAttribute('disabled');
        document.getElementById('chkFuzzy').removeAttribute('disabled');
    }
    else {
        document.getElementById('btnQuery').setAttribute('disabled', true);
        document.getElementById('chkFuzzy').setAttribute('disabled', true);
    }
}

