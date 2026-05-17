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
 * 考慮 Unicode 將 base64 解碼轉成文字
 * @param {string} base64 要解碼的文字
 * @returns 
 */
function convertBase64ToText(base64){
    const decoded = atob(base64);
    const chars = [];
    for (const ch of decoded){
        chars.push(ch.codePointAt(0));
    }
    return new TextDecoder().decode(Uint8Array.from(chars));
}

/**
 * 考慮 Unicode 將文字轉成 base64 編碼
 * @param {string} text 要編碼的文字
 * @returns 
 */
function convertTextToBase64(text){
    const bytes = new TextEncoder().encode(text);
    const chars = [];
    for (const byte of bytes){
        chars.push(String.fromCodePoint(byte));
    }
    return btoa(chars.join(''));
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

        // 忽略大小寫處理
        for (let i = 0, n = queryWords.length; i < n; i++){
            queryWords[i] = queryWords[i].toLowerCase();
        }
        for (const data of datas){
            if (data.keyword){
                data.keyword = data.keyword.toLowerCase();
            }
        }

        if (config.isFuzzy){
            // 模糊查詢用 or
            return filterOr(datas, queryWords, skipCount, pageSize);
        }
        else{
            // and
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
 * 產生隨機 UUID 文字
 * @returns UUID 字串
 */
function generateUUID(){
    const temp = new Array(32), result = new Array(32);
    temp[12] = 4;
    temp[16] = (Math.random() * 4 | 0) | 8;
    for (let i = 0; i < 12; i++){
        temp[i] = Math.random() * 16 | 0;
    }
    for (let i = 12; i < 16; i++){
        temp[i] = Math.random() * 16 | 0;
    }
    for (let i = 16; i < 32; i++){
        temp[i] = Math.random() * 16 | 0;
    }
    for (let i = 0; i < 32; i++){
        result[i] = temp[i].toString(16).toUpperCase();
    }
    return result.join('');
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
    document.getElementById('btnQuery').addEventListener('click', query);
    document.getElementById('iptKeyword').addEventListener('keyup', pressKeyword);
    document.getElementById('chkFuzzy').addEventListener('change', query);
    refreshData(true);
}

/**
 * 讓關鍵字文字框可按 Enter 做出查詢動作 
 * @param {any} e 按鍵事件
 */
function pressKeyword(e) {
    if (e.key == 'Enter'){
        document.getElementById('btnQuery').click();
    }
    else if (e.altKey && e.code === 'KeyU'){
        alert(generateUUID());
    }
}

/**
 * 按下查詢按鈕或勾選是否模糊查詢後的更新頁面動作
 */
function query(){
    const data = {
        query: document.getElementById('iptKeyword').value,
        isFuzzy: document.getElementById('chkFuzzy').checked
    };
    if (!data.query && !data.isFuzzy){
        location.href = 'index.html';
    }
    else{
        const param = encodeURIComponent(convertTextToBase64(JSON.stringify(data)));
        switchEnable(false);
        location.href = `index.html?q=${param}`;
    }
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
 * 將網址傳入的查詢關鍵字，放入輸入框與是否模糊查詢勾選框
 */
function setConfig(){
    if (location.search){
        const variables = new URLSearchParams(location.search);
        console.log(variables);
        if (variables && variables.size !== 0){
            try {
                const q = variables.get('q');
                const param = JSON.parse(convertBase64ToText(decodeURIComponent(q)));
                config.query = param.query;
                config.isFuzzy = param.isFuzzy;
                document.getElementById('iptKeyword').value = config.query;
                document.getElementById('chkFuzzy').checked = config.isFuzzy;
            } catch (error) {
                console.error(error);
            }
        }
    }
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

