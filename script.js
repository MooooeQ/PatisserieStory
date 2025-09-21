
/* ===== 预加载第一张立绘 ===== */
const firstAvatar = new Image();
firstAvatar.src = 'images/customer1_think.webp';

/* ==========  全局状态  ========== */
const RENT = 300;
const recipes = [
    {name:'提拉米苏',ingr:['鸡蛋','巧克力','糖浆'],price:100,fame:10},
    {name:'抹茶千层',ingr:['面粉','鸡蛋','抹茶粉'],price:110,fame:11},
    {name:'苹果派',ingr:['苹果','面粉','糖浆'],price:80,fame:8},
    {name:'马卡龙',ingr:['杏仁粉','鸡蛋','巧克力'],price:120,fame:12},
    {name:'焦糖布丁',ingr:['糖浆','鸡蛋','面粉'],price:85,fame:9}
];


let round = 1, customer = 1, money = 200, fame = 0;
let patienceTimer = null, patienceSec = 30;
let currentIngr = [];
let bakeResult = 1; // 0失败 1良好 2完美

// ===== 自定义弹窗系统 =====
function showModal(title, content, type = 'default', onConfirm = null) {
    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.className = `modal-overlay modal-${type}`;
    
    // 创建弹窗内容
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // 创建关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = () => hideModal(overlay);
    
    // 创建标题
    const header = document.createElement('div');
    header.className = 'modal-header';
    const titleEl = document.createElement('h2');
    titleEl.className = 'modal-title';
    titleEl.textContent = title;
    header.appendChild(titleEl);
    
    // 创建内容
    const body = document.createElement('div');
    body.className = 'modal-body';
    body.innerHTML = content;
    
    // 创建按钮区域
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'modal-btn';
    confirmBtn.textContent = '确定';
    confirmBtn.onclick = () => {
        if (onConfirm) onConfirm();
        hideModal(overlay);
    };
    footer.appendChild(confirmBtn);
    
    // 组装弹窗
    modalContent.appendChild(closeBtn);
    modalContent.appendChild(header);
    modalContent.appendChild(body);
    modalContent.appendChild(footer);
    overlay.appendChild(modalContent);
    
    // 添加到页面
    document.body.appendChild(overlay);
    
    // 显示动画
    setTimeout(() => {
        overlay.classList.add('show');
    }, 10);
    
    // 点击遮罩关闭
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            hideModal(overlay);
        }
    };
    
    // ESC键关闭
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            hideModal(overlay);
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

function hideModal(overlay) {
    overlay.classList.remove('show');
    setTimeout(() => {
        if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    }, 300);
}

// 特殊弹窗函数
function showRecipeModal(recipeText) {
    const content = `
        <div style="text-align: left; font-family: monospace; background: #f8f9fa; padding: 15px; border-radius: 10px; border-left: 4px solid #ffb74d;">
            ${recipeText.replace(/\n/g, '<br>')}
        </div>
    `;
    showModal('📖 菜谱', content, 'recipe');
}

function showUnlockModal(unlockMessage, story) {
    const content = `
        <div style="text-align: center;">
            <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
            <div style="font-size: 18px; font-weight: bold; color: #2e7d32; margin-bottom: 15px;">
                ${unlockMessage}
            </div>
            <div style="background: #e8f5e8; padding: 15px; border-radius: 10px; border-left: 4px solid #4caf50;">
                ${story}
            </div>
        </div>
    `;
    showModal('✨ 新顾客解锁', content, 'unlock');
}

function showGameOverModal() {
    // 播放破产失败音效
    playEndingFailSound();
    
    const content = `
        <div style="text-align: center;">
            <div style="font-size: 48px; margin-bottom: 15px;">💸</div>
            <div style="font-size: 20px; font-weight: bold; color: #c62828;">
                破产啦！游戏结束
            </div>
            <div style="margin-top: 15px; color: #666;">
                重新开始游戏吧！
            </div>
        </div>
    `;
    showModal('游戏结束', content, 'gameover', () => {
        location.reload();
    });
}

function showRoundEndModal(money, fame, ending) {
    const content = `
        <div style="text-align: center;">
            <div style="font-size: 48px; margin-bottom: 15px;">🏆</div>
            <div style="font-size: 18px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: center; gap: 30px; margin-bottom: 15px;">
                    <div style="color: #ffd700; font-weight: bold;">
                        💰 ${money}
                    </div>
                    <div style="color: #ff6b6b; font-weight: bold;">
                        ⭐ ${fame}
                    </div>
                </div>
            </div>
            <div style="background: #e3f2fd; padding: 15px; border-radius: 10px; border-left: 4px solid #2196f3; font-style: italic;">
                ${ending.description}
            </div>
        </div>
    `;
    showModal(ending.title, content, 'roundend', () => {
        location.reload();
    });
}

function showRoundSummaryModal(msg) {
    // 解析消息内容，将每行分开显示
    const lines = msg.split('\n').filter(line => line.trim() !== '');
    const content = `
        <div style="text-align: center;">
            <div style="font-size: 48px; margin-bottom: 15px;">📊</div>
            <div style="font-size: 16px; line-height: 1.8; color: #1565c0;">
                ${lines.map(line => `<div style="margin-bottom: 8px;">${line}</div>`).join('')}
            </div>
            <div style="margin-top: 20px; color: #666; font-style: italic;">
                准备迎接下一回合的挑战！
            </div>
        </div>
    `;
    showModal('回合结算', content, 'roundend');
}

function showGameStartModal() {
    const content = `
        <div style="text-align: center;">
            <div style="font-size: 48px; margin-bottom: 15px;">🍨</div>
            <div style="font-size: 18px; font-weight: bold; color: #e65100; margin-bottom: 15px;">
                欢迎来到甜心物语！
            </div>
            <div style="background: #fff8e1; padding: 15px; border-radius: 10px; border-left: 4px solid #ffb74d; font-size: 16px; line-height: 1.6;">
                初始资金紧张，请谨慎经营，<br>
                确保按时缴纳每回合💰 <strong style="color: #e65100;">300</strong> 的房租。
            </div>
            <div style="margin-top: 15px; color: #666; font-style: italic;">
                祝您经营顺利！
            </div>
        </div>
    `;
    showModal('游戏开始', content, 'recipe');
}

// 新结局判定函数
function getGameEnding(money, fame) {
    // 传奇甜品大师：金钱 > 3300 且 声誉 > 400
    if (money > 3000 && fame > 600) {
        playEndingSuccessSound(); // 播放成功音效
        return {
            title: '传奇甜品大师',
            description: '你的店登上了美食杂志的封面，被称为"本世纪必去的甜品天堂"。人们来这里不仅为了无可挑剔的美味，更为感受你倾注在每一份甜品中的心意。',
            type: 'legendary'
        };
    }
    
    // 街角的心灵小馆：声誉 > 450 且 金钱 < 2800
    if (fame > 450 && money > 2000) {
        playEndingSuccessSound(); // 播放成功音效
        return {
            title: '街角的心灵小馆',
            description: '这里卖的不仅是甜点，更是街坊们的回忆和温暖，它早已成为了大家心中无可替代的灯塔。',
            type: 'heart'
        };
    }
    
    // 伤痕累累的幸存者：金钱 >= 2800 且未达到上述结局
    if (money >= 1500) {
        playEndingFailSound(); // 播放失败音效
        return {
            title: '伤痕累累的幸存者',
            description: '最后一次将房租递给房东时，你的手还在因长期劳累而微微颤抖。这十年是一场艰苦的马拉松，你跌跌撞撞，数次濒临绝境，但终究是撑了下来。店铺依旧简陋，但它是完全属于你的了。你看着夕阳照进空店，长舒一口气——至少，活下来了。明天，可以重新开始了。',
            type: 'survivor'
        };
    }
    
    // 默认普通结局
    playEndingFailSound(); // 播放失败音效
    return {
        title: '平淡结局',
        description: '日子还长，慢慢经营吧～',
        type: 'normal'
    };
}

let roundEarnings = 0; // 当前回合收入
let roundFame = 0; // 当前回合声誉
let currentOrder = null; // 当前顾客的订单
let isSpecialCustomer = false; // 是否为特殊顾客
let specialCustomerType = null; // 特殊顾客类型
let unlockedDishes = []; // 已解锁的专属菜品
let specialCustomerSpawned = false; // 特殊顾客是否已出现
let currentAvatarType = null; // 当前顾客使用的立绘类型（normal-idx 或 special type）
let pendingDialog = null; // 两段式对话的后半段 { part2: string, emoji: string|null }
let specialCustomerIndexForRound = null; // 本回合特殊顾客出现的位置（1-5）

// 将配料数组标准化为对比用键（不修改原数组）
function getIngrKey(list){
	return [...list].sort().join('|');
}

function initRoundState() {
    specialCustomerSpawned = false;
    // 仅在 3/6/9 回合随机决定特殊顾客出现的序号（1..5）
    if ([3,6,9].includes(round)) {
        specialCustomerIndexForRound = Math.floor(Math.random() * 5) + 1;
    } else {
        specialCustomerIndexForRound = null;
    }
}



/* ==========  特殊顾客系统  ========== */
const specialCustomers = [
    {
        type: 'food_blogger',
        name: '美食博主',
        avatar: '📸',
        round: 3,
        dialog: '嗨！我是来探店的~ 最近你们店在网上很火哦。给我来一份好看出片的甜品吧，我的粉丝们都很期待呢！',
        dish: '彩虹蛋糕',
        ingredients: ['面粉', '鸡蛋', '食用色素'],
        price: 150,
        fame: 20,
        story: '色彩缤纷的梦幻蛋糕，拍照效果绝佳',
        unlockMessage: '恭喜！你学会了制作彩虹蛋糕！',
        successDialog: '哇！这个颜色太梦幻了！光是看着就心情超好！完美！等我修好图就发帖，我会让粉丝也来尝尝~',
        failDialog: '嗯...这个卖相好像...差了点意思。算了，我再去别家看看吧。'
    },
    {
        type: 'french_tourist',
        name: '法国游客',
        avatar: '🇫��',
        round: 6,
        dialog: 'Bonjour（你好）。我来自巴黎，恕我直言，我尝过世界上最顶级的甜品。希望你们能给我一些创新的、不一样的惊喜。',
        dish: '抹茶杏仁酥',
        ingredients: ['抹茶粉', '杏仁粉', '奶油'],
        price: 160,
        fame: 24,
        story: '法式工艺与日式抹茶的完美融合',
        unlockMessage: '你获得了法式甜品技艺！抹茶杏仁酥已解锁！',
        successDialog: 'Incroyable!（太不可思议了！）这种口感的碰撞...既大胆又和谐！我收回我先前的质疑，你们很有创意！',
        failDialog: '很遗憾，这并没有跳出传统的框架。我想我找不到我想要的惊喜。'
    },
    {
        type: 'couple',
        name: '纪念日情侣',
        avatar: '��',
        round: 9,
        dialog: '（男生小声说）今天是我们在一起三周年的纪念日，我想给她一个惊喜。请务必做一份最浪漫、最有爱的甜品！',
        dish: '草莓奶油杯',
        ingredients: ['草莓', '奶油', '鸡蛋'],
        price: 140,
        fame: 18,
        story: '充满爱意的浪漫甜品，见证美好时光',
        unlockMessage: '你学会了制作浪漫甜品！草莓奶油杯已解锁！',
        successDialog: '天哪！是草莓味的！亲爱的你太用心了！谢谢你，这真的是最棒的纪念日礼物！',
        failDialog: '哦...谢谢。'
    }
];

// 预计算：菜谱键映射（提升检索性能）
const recipeKeyMap = new Map(); // key -> recipeName
recipes.forEach(r => {
	const key = getIngrKey(r.ingr);
	recipeKeyMap.set(key, r.name);
});

// 特殊菜谱键映射：key -> special对象
const specialKeyMap = new Map();
specialCustomers.forEach(sc => {
	const key = getIngrKey(sc.ingredients);
	specialKeyMap.set(key, sc);
});

// 检查当前回合是否应该出现特殊顾客
function shouldSpawnSpecialCustomer() {
    const specialCustomer = specialCustomers.find(sc => sc.round === round);
    if (!specialCustomer) return false;
    if (specialCustomerSpawned) return false;
    // 仅在预定的顾客序号出现特殊顾客
    if (specialCustomerIndexForRound == null) return false;
    return customer === specialCustomerIndexForRound;
}

// 获取当前回合的特殊顾客
function getCurrentRoundSpecialCustomer() {
    return specialCustomers.find(sc => sc.round === round);
}

/* ==========  背景音乐管理  ========== */
let bgm = null;
let currentBgmIndex = 0;
const bgmList = [
    'bgm1.mp3',  // 请将您的第一首音乐文件重命名为 bgm1.mp3
    'bgm2.mp3'   // 请将您的第二首音乐文件重命名为 bgm2.mp3
];
let isMusicEnabled = true;

/* ==========  音效管理  ========== */
let bakeSound = null;
const bakeSoundFile = 'bake_complete.wav'; // 烘焙完成音效文件

// 结局音效
let endingSuccessSound = null;
let endingFailSound = null;
const endingSuccessSoundFile = 'ending_success.wav'; // 成功结局音效文件
const endingFailSoundFile = 'ending_fail.wav'; // 失败结局音效文件

/* ==========  音乐初始化  ========== */
function initBGM() {
    bgm = new Audio();
    bgm.loop = true;
    bgm.volume = 0.3; // 设置音量为30%
    loadBGM();
}

/* ==========  音效初始化  ========== */
function initSoundEffects() {
    // 烘焙音效
    bakeSound = new Audio();
    bakeSound.src = bakeSoundFile;
    bakeSound.volume = 0.5; // 设置音效音量为50%
    bakeSound.preload = 'auto';
    
    // 结局音效
    endingSuccessSound = new Audio();
    endingSuccessSound.src = endingSuccessSoundFile;
    endingSuccessSound.volume = 0.6; // 设置成功结局音效音量为60%
    endingSuccessSound.preload = 'auto';
    
    endingFailSound = new Audio();
    endingFailSound.src = endingFailSoundFile;
    endingFailSound.volume = 0.6; // 设置失败结局音效音量为60%
    endingFailSound.preload = 'auto';
}

/* ==========  播放烘焙音效  ========== */
function playBakeSound() {
    if (isMusicEnabled && bakeSound) {
        // 重置音效到开始位置，确保可以重复播放
        bakeSound.currentTime = 0;
        bakeSound.play().catch(e => {
            console.log('烘焙音效播放失败:', e);
        });
    }
}

/* ==========  播放结局音效  ========== */
function playEndingSuccessSound() {
    if (isMusicEnabled && endingSuccessSound) {
        endingSuccessSound.currentTime = 0;
        endingSuccessSound.play().catch(e => {
            console.log('成功结局音效播放失败:', e);
        });
    }
}

function playEndingFailSound() {
    if (isMusicEnabled && endingFailSound) {
        endingFailSound.currentTime = 0;
        endingFailSound.play().catch(e => {
            console.log('失败结局音效播放失败:', e);
        });
    }
}

function loadBGM() {
    if (bgmList.length === 0) return;
    bgm.src = bgmList[currentBgmIndex];
    bgm.load();
}

function playBGM() {
    if (isMusicEnabled && bgm) {
        bgm.play().catch(e => {
            console.log('音乐播放失败，可能需要用户交互:', e);
        });
    }
}

function pauseBGM() {
    if (bgm) {
        bgm.pause();
    }
}

function switchBGM() {
    if (bgmList.length <= 1) return;
    currentBgmIndex = (currentBgmIndex + 1) % bgmList.length;
    loadBGM();
    if (isMusicEnabled) {
        playBGM();
    }
}

/* ==========  页面切换  ========== */
function startGame(){
    preloadFirstAvatar();
    document.getElementById('titlePage').style.display = 'none';
    document.getElementById('gamePage').style.display = 'flex';
    
    // 移除标题页类，恢复box背景
    const box = document.getElementById('box');
    if (box) {
        box.classList.remove('title-page');
    }
    
    updateUI();
    initRoundState();
    startPatience();
    genIngrButtons();
    playBGM(); // 开始游戏时播放音乐
    
    // 显示游戏开始提示
    showGameStartModal();
    // 异步探测普通顾客立绘
    detectNormalAvatars().then(()=>{
        console.log('立绘预加载完成');
    });
    
    // 设置第一个顾客的订单
    pendingDialog = null;
    document.getElementById('customerWords').textContent = getNextDialog();
}
function updateUI(){
    document.getElementById('round').textContent = round;
    document.getElementById('customerNo').textContent = customer;
    document.getElementById('money').textContent = money;
    document.getElementById('fame').textContent = fame;
}

/* ==========  顾客耐心倒计时  ========== */
function startPatience(){
    const bar = document.getElementById('patienceFill');
    let w = 100;
    if (patienceTimer) clearInterval(patienceTimer);
    patienceTimer = setInterval(()=>{
        w -= 100 / patienceSec;
        if(w <= 0) { clearInterval(patienceTimer); w=0; failCustomer(); }
        bar.style.width = w + '%';
    }, 1000);
    
}

/* ==========  添加点击引导  ========== */
function addClickHint() {
    // 移除之前的引导（如果存在）
    removeClickHint();
    
    // 创建点击引导
    const hint = document.createElement('div');
    hint.id = 'clickHint';
    hint.innerHTML = '💬 点击继续对话';
    hint.style.cssText = `
        position: fixed;
        bottom: 120px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #ffb6d5, #ffc0cb);
        color: white;
        padding: 12px 20px;
        border-radius: 25px;
        font-size: 14px;
        font-weight: bold;
        z-index: 1000;
        pointer-events: none;
        animation: bounce 1.5s infinite;
        box-shadow: 0 6px 20px rgba(255, 182, 213, 0.4), 0 2px 8px rgba(255, 182, 213, 0.2);
        border: 2px solid rgba(255, 255, 255, 0.3);
        backdrop-filter: blur(10px);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    `;
    
    document.body.appendChild(hint);
    
    // 3秒后自动移除引导
    setTimeout(() => {
        removeClickHint();
    }, 3000);
}

/* ==========  移除点击引导  ========== */
function removeClickHint() {
    const hint = document.getElementById('clickHint');
    if (hint && hint.parentNode) {
        hint.parentNode.removeChild(hint);
    }
}

/* ==========  显示进入后厨按钮  ========== */
function showEnterKitchenButton() {
    // 移除点击引导
    removeClickHint();
    
    // 显示默认的进入后厨按钮（使用与普通顾客相同的样式）
    const defaultBtn = document.getElementById('defaultEnterKitchenBtn');
    if (defaultBtn) {
        defaultBtn.style.display = 'inline-block';
    }
}

/* ==========  进入后厨  ========== */
function enterKitchen(){
    clearInterval(patienceTimer);
    document.getElementById('gamePage').style.display = 'none';
    document.getElementById('kitchenPage').style.display = 'flex';
    
    // 重置配料选择
    currentIngr = [];
    
    // 更新配料按钮状态
    document.querySelectorAll('.ingr').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // 更新搅拌碗显示
    updateMixBowl();
    
    // 检查并解锁特殊配料
    checkSpecialCustomerIngredients();
}


/* ==========  配料按钮（电脑拖拽 + 手机触摸拖）  ========== */
// 基础配料（始终可用）
const BASE_INGREDIENTS = ['面粉','鸡蛋','巧克力','抹茶粉','苹果','糖浆','杏仁粉'];

// 配料图片映射
const INGREDIENT_IMAGES = {
    '面粉': 'ingr_面粉.webp',
    '鸡蛋': 'ingr_鸡蛋.webp', 
    '巧克力': 'ingr_巧克力.webp',
    '抹茶粉': 'ingr_抹茶粉.webp',
    '苹果': 'ingr_苹果.webp',
    '糖浆': 'ingr_糖浆.webp',
    '杏仁粉': 'ingr_杏仁粉.webp',
    '食用色素': 'ingr_食用色素.webp',
    '奶油': 'ingr_奶油.webp',
    '草莓': 'ingr_草莓.webp'
};

// 动态配料数组（会根据特殊顾客解锁而增加）
let INGREDIENTS = [...BASE_INGREDIENTS];
function genIngrButtons(){
    const list = document.getElementById('ingrList');
    list.innerHTML = '';
    INGREDIENTS.forEach(n=>{
        const b = document.createElement('div');
        b.className = 'ingr';
        b.dataset.ingr = n;
        b.style.touchAction = 'none';   // 防止系统默认行为
        
        // 创建配料图片
        const img = document.createElement('img');
        img.src = `images/${INGREDIENT_IMAGES[n] || 'ingr_默认.webp'}`;
        img.alt = n;
        img.className = 'ingr-image';
        img.onerror = () => {
            // 如果图片加载失败，显示文字作为后备
            img.style.display = 'none';
            b.textContent = n;
            b.classList.add('ingr-text-fallback');
        };
        
        b.appendChild(img);
        makeDraggable(b);
        list.appendChild(b);
    });
    // 碗接收
    const bowl = document.getElementById('mixBowl');
    bowl.ondragover = ev=>ev.preventDefault();
    bowl.ondrop = ev=>{
        const n = ev.dataTransfer.getData('ingr');
        if(n) addIngr(n);
    };
}

/* ==========  统一拖拽逻辑（鼠标 + 触摸）  ========== */
function makeDraggable(elem){
    let startX, startY, initialX, initialY, dragged = false;
    // 鼠标按下
    elem.onmousedown = down;
    // 触摸开始
    elem.ontouchstart = (ev)=>{
        const t = ev.touches[0];
        down({clientX:t.clientX, clientY:t.clientY, target:elem});
    };
    function down(ev){
        dragged = false;
        startX = ev.clientX; startY = ev.clientY;
        initialX = elem.offsetLeft; initialY = elem.offsetTop;
        // 防止图片被选中
        elem.style.userSelect = 'none';
        elem.style.pointerEvents = 'none';
        document.onmousemove = move;
        document.onmouseup = up;
        document.ontouchmove = (e)=>{
            const t = e.touches[0];
            move({clientX:t.clientX, clientY:t.clientY});
        };
        document.ontouchend = up;
    }
    function move(ev){
        const dx = ev.clientX - startX, dy = ev.clientY - startY;
        if(Math.abs(dx)>5||Math.abs(dy)>5) dragged = true;
        elem.style.transform = `translate(${dx}px, ${dy}px)`;
        elem.style.zIndex = '1000'; // 确保拖拽时在最上层
    }
    function up(ev){
        document.onmousemove = null; document.onmouseup = null;
        document.ontouchmove = null; document.ontouchend = null;
        if(dragged){
            // 看是否落在碗里
            const bowl = document.getElementById('mixBowl');
            const bRect = bowl.getBoundingClientRect();
            const eRect = elem.getBoundingClientRect();
            if(eRect.left < bRect.right && eRect.right > bRect.left &&
               eRect.top < bRect.bottom && eRect.bottom > bRect.top){
                addIngr(elem.dataset.ingr);
            }
        }
        // 恢复样式
        elem.style.transform = '';
        elem.style.zIndex = '';
        elem.style.userSelect = '';
        elem.style.pointerEvents = '';
    }
}

/* ==========  加料通用  ========== */
function addIngr(n){
    if(currentIngr.length<3 && !currentIngr.includes(n)){
        currentIngr.push(n);
        updateBowl();
        if(currentIngr.length===3) document.getElementById('bakeBtn').disabled = false;
    }
}
function updateBowl(){
    const bowl = document.getElementById('mixBowl');
    bowl.textContent = currentIngr.length ? currentIngr.join('+') : '拖入3种配料';
    document.getElementById('bakeBtn').disabled = currentIngr.length !== 3;
}

/* ==========  配料解锁系统  ========== */
function unlockIngredient(ingredient) {
    if (!INGREDIENTS.includes(ingredient)) {
        INGREDIENTS.push(ingredient);
        // 重新生成配料按钮
        genIngrButtons();
        console.log(`新配料解锁：${ingredient}`);
    }
}

// 检查特殊顾客是否已到来，解锁对应配料
function checkSpecialCustomerIngredients() {
    if (round >= 3) {
        unlockIngredient('食用色素'); // 
    }
    if (round >= 6) {
        unlockIngredient('奶油'); // 法国游客解锁奶油
    }
    if (round >= 9) {
        unlockIngredient('草莓'); // 
    }
}

/* ==========  菜谱  ========== */
function toggleRecipe(){
    const recipeText = getRecipeDisplayText();
    showRecipeModal(recipeText);
}

/* ==========  同页烘焙 → 反应条遮罩  ========== */
function goBake(){
    document.getElementById('bakeCover').style.display = 'flex';
    document.getElementById('bakeBtn').style.display = 'none'; // 隐藏开始烘焙按钮
    drawRing();
    ringReset();
}

/* ==========  半圆环反应条（修正版）  ========== */
/* ==========  色块环（无渐变）  ========== */
const ring = {
    canvas: document.getElementById('ringCanvas'),
    ctx: null,
    w: 720, h: 720,
    radius: 250,
    lineW: 40,
    angle: 0,          // 0-1 对应 0-π
    speed: 0.02,
    dir: 1
};
ring.ctx = ring.canvas.getContext('2d');

function drawRing(){
    const ctx = ring.ctx, c = ring.canvas;
    ctx.clearRect(0, 0, c.width, c.height);
    const cx = c.width / 2, cy = c.height / 2;
    // 背景灰环
    ctx.beginPath();
    ctx.arc(cx, cy, ring.radius, Math.PI, 2 * Math.PI);
    ctx.lineWidth = ring.lineW;
    ctx.strokeStyle = '#e5e5e5';
    ctx.stroke();
    // 色块：失败-良好-完美-良好-失败
    /* ==========  对称色块环（完美居中）  ========== */
    const bands = [
        {start:Math.PI,        end:Math.PI*1.25, color:'#ff7675'}, // 失败 25%（左半）
        {start:Math.PI*1.25,   end:Math.PI*1.4,  color:'#ffeaa7'}, // 良好左 15%
        {start:Math.PI*1.4,    end:Math.PI*1.6,  color:'#7bed9f'}, // 完美 20%（居中）
        {start:Math.PI*1.6,    end:Math.PI*1.75, color:'#ffeaa7'}, // 良好右 15%
        {start:Math.PI*1.75,   end:Math.PI*2,    color:'#ff7675'}  // 失败 25%（右半）
    ];
    bands.forEach(b=>{
        ctx.beginPath();
        ctx.arc(cx, cy, ring.radius, b.start, b.end);
        ctx.strokeStyle = b.color;
        ctx.lineWidth = ring.lineW;
        ctx.stroke();
    });
    // 滑块
    const ballAng = Math.PI + ring.angle * Math.PI;
    const ballX = cx + Math.cos(ballAng) * ring.radius;
    const ballY = cy + Math.sin(ballAng) * ring.radius;
    ctx.beginPath();
    ctx.arc(ballX, ballY, ring.lineW / 2 + 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#ffb6d5';
    ctx.lineWidth = 8;
    ctx.stroke();
}

function ringReset(){
    ring.angle = 0; ring.dir = 1;
    ring.loop = setInterval(()=>{
        ring.angle += ring.speed * ring.dir;
        if(ring.angle >= 1) ring.dir = -1;
        if(ring.angle <= 0) ring.dir = 1;
        drawRing();
    }, 16);
}

function stopRing(){
    clearInterval(ring.loop);
    let res = 0;
    if(ring.angle > 0.4 && ring.angle < 0.6) res = 2;
    else if(ring.angle > 0.25 && ring.angle < 0.75) res = 1;
    bakeResult = res;

    // 播放烘焙完成音效
    playBakeSound();

    // 1. 立即关遮罩
    document.getElementById('bakeCover').style.display = 'none';
    document.getElementById('bakeBtn').style.display = 'block'; // 重新显示开始烘焙按钮

    // 2. 先判菜品（日志调试用）
    const dishName = checkRecipe();
    console.log('停住角度:', ring.angle, '菜品:', dishName);

    // 3. 显示评价页（在清空配料之前）
    showEval(dishName);

    // 4. 清碗（在评价完成后）
    currentIngr = [];
    updateBowl();
}

/* ==========  检查配方  ========== */
function checkRecipe() {
    const key = getIngrKey(currentIngr);

    // 1) 特殊菜：仅当特殊顾客回合已到（不要求已出现）
    const sc = specialKeyMap.get(key);
    if (sc && round >= sc.round) {
        console.log(`匹配到特殊菜谱: ${sc.dish}`);
        return sc.dish;
    }

    // 2) 普通菜
    const normal = recipeKeyMap.get(key);
    if (normal) {
        console.log(`匹配到普通菜谱: ${normal}`);
        return normal;
    }

    console.log('没有匹配到任何菜谱');
    return null;
}


/* ==========  顾客评价  ========== */
function showEval(dishName) {
    try {
        console.log('=== 评价开始 ===');
        console.log('进入showEval', dishName, 'bakeResult:', bakeResult);
        console.log('当前配料:', currentIngr);
        console.log('当前订单:', currentOrder);
        console.log('是否为特殊顾客:', isSpecialCustomer);
        console.log('特殊顾客类型:', specialCustomerType);
        
        // 检查是否与顾客订单匹配
        let finalResult;
        
        if (!dishName) {
            // 配方错误，直接失败
            finalResult = 0;
            console.log('配方错误，强制失败');
        } else if (dishName !== currentOrder) {
            // 配方正确但不是顾客要的，直接失败
            finalResult = 0;
            console.log('做错了菜品，顾客要的是:', currentOrder, '但做的是:', dishName);
        } else {
            // 配方正确且是顾客要的，根据反应条判定
            finalResult = bakeResult;
            console.log('菜品正确，使用反应条结果:', bakeResult);
        }
        
        console.log('最终评价结果:', finalResult);
        
        let evalData;
        
        if (!dishName) {
            // 配方错误
            evalData = {
                0: { emoji: '😵', words: '这黑暗料理是怎么回事！' }
            };
        } else if (dishName !== currentOrder) {
            // 做错了菜品
            const dishImgMap = {
                // 普通
                '提拉米苏': 'dish_提拉米苏.webp',
                '抹茶千层': 'dish_抹茶千层.webp',
                '苹果派': 'dish_苹果派.webp',
                '马卡龙': 'dish_马卡龙.webp',
                '焦糖布丁': 'dish_焦糖布丁.webp',
                // 特殊
                '彩虹蛋糕': 'dish_彩虹蛋糕.webp',
                '抹茶杏仁酥': 'dish_抹茶杏仁酥.webp',
                '草莓奶油杯': 'dish_草莓奶油杯.webp',
                // 失败
                '黑暗料理': 'dish_黑暗料理.webp'
              };
            
            // 统一由 showDishResult 渲染
            
            // 设置做错菜品的评价数据
            evalData = {
                0: { emoji: '😤', words: '我要的是' + currentOrder + '，你给我' + dishName + '干什么！' }
            };
        } else {
            // 菜品正确，根据反应条
            if (isSpecialCustomer) {
                // 特殊顾客的评价
                const special = specialCustomers.find(sc => sc.type === specialCustomerType);
                if (special) {
                    evalData = {
                        2: { emoji: '😍', words: special.successDialog },
                        1: { emoji: '😊', words: special.successDialog },
                        0: { emoji: '😐', words: special.failDialog }
                    };
                }
            } else {
                // 普通顾客的评价
                evalData = {
                    2: { emoji: '😍', words: '太棒了~这就是我想要的味道！' },
                    1: { emoji: '😊', words: '嗯～很不错，下次还会再来！' },
                    0: { emoji: '😐', words: '有点一般呢…' }
                };
            }
        }
        
        // 确保 evalData 有对应的键
        console.log('finalResult:', finalResult, 'evalData:', evalData);
        if (!evalData || !evalData[finalResult]) {
            console.error('evalData 缺少键:', finalResult, 'evalData:', evalData);
            finalResult = 0; // 默认使用失败评价
        }
        // 强制保证特殊顾客失败评价用其 failDialog
        if (isSpecialCustomer && finalResult === 0) {
            const special = specialCustomers.find(sc => sc.type === specialCustomerType);
            if (special) {
                evalData[0] = { emoji: '😐', words: special.failDialog };
            }
        }
        const e = evalData[finalResult];
        console.log('选择的评价数据:', e);

        // 在同一页面写入评价内容（两段式）
        const words = document.getElementById('customerWords');
        const parts = splitDialogText(e.words);
        words.textContent = `${e.emoji} ${parts[0]}`;
        pendingDialog = parts[1] ? { part2: parts[1], emoji: e.emoji } : null;
        
        // 切换同一立绘为 happy/angry
        const evalType = currentAvatarType || document.querySelector('.customer-avatar')?.dataset.avatarType || (isSpecialCustomer ? specialCustomerType : pickRandomNormalType());
        setEvalAvatar(evalType, finalResult);
        
        // 切回前台并进入评价状态
        const game = document.getElementById('gamePage');
        const kitchen = document.getElementById('kitchenPage');
        if (kitchen) kitchen.style.display = 'none';
        if (game) game.style.display = 'flex';
        game.classList.add('game-eval');
        document.getElementById('dishResult').style.display = 'flex';
        
        // 如果有第二段对话，隐藏“好的”按钮并添加引导
        if (pendingDialog && pendingDialog.part2) {
            document.getElementById('evalOkBtn').style.display = 'none';
            // 为评价页添加点击引导
            setTimeout(() => {
                addClickHint();
                // 为对话气泡添加视觉提示
                const wordsEl = document.getElementById('customerWords');
                if (wordsEl) {
                    wordsEl.classList.add('has-pending');
                }
            }, 1000); // 1秒后显示引导
        } else {
            // 没有第二段对话，直接显示“好的”按钮
            document.getElementById('evalOkBtn').style.display = 'inline-block';
        }

        // 再算钱 & 声誉（使用最终评价结果）
        let earn, f;
        
        if (finalResult === 0) {
            // 烘焙失败：不给金钱，扣除声誉
            earn = 0;
            f = -3; // 扣除3点声誉
        } else {
            // 烘焙成功：正常计算
            let mult = [0, 1.0, 1.2][finalResult]; // 失败0倍，良好1倍，完美1.2倍
            earn = Math.floor((dishName ? getDishPrice(dishName) : 40) * mult);
            f = (dishName ? getDishFame(dishName) : 4) + (finalResult === 2 ? 3 : 0);
        }
        
        if (!dishName) f = -2;

        // 统一显示成品图
        showDishResult(dishName, finalResult);
                
        money += earn; fame += f;
        updateUI();
        
        // 显示这回合获得的金币和声誉值动画
        showRoundEarnings(earn, f);

        // 在成功服务特殊顾客后
        if (isSpecialCustomer && dishName === currentOrder && finalResult >= 1) {
            const special = specialCustomers.find(sc => sc.type === specialCustomerType);
            if (special && !unlockedDishes.includes(special.dish)) {
                unlockedDishes.push(special.dish);
                
                // 显示解锁消息
                setTimeout(() => {
                    showUnlockModal(special.unlockMessage, special.story);
                }, 1000);
            }
        }
        
        // 记录当前回合的收入和声誉（一次即可）
        roundEarnings += earn;
        roundFame += f;
        updateUI();

    } catch (err) {
        console.error('showEval 报错：', err);
        // 强制进入评价状态（不管任何样式冲突）
        const game = document.getElementById('gamePage');
        const kitchen = document.getElementById('kitchenPage');
        if (kitchen) kitchen.style.display = 'none';
        if (game) game.style.display = 'flex';
        game.classList.add('game-eval');
        console.log('评价状态已强制启用');
    }
}

function closeEval(){
    // 退出评价状态，恢复点单视图
    document.getElementById('gamePage').classList.remove('game-eval');
    document.getElementById('dishResult').style.display = 'none';
    document.getElementById('evalOkBtn').style.display = 'none';
    
    // 清理引导状态
    removeClickHint();
    const wordsEl = document.getElementById('customerWords');
    if (wordsEl) {
        wordsEl.classList.remove('has-pending');
    }
    pendingDialog = null;
    
    // 恢复立绘为思考态
    const type = currentAvatarType || document.querySelector('.customer-avatar')?.dataset.avatarType || (isSpecialCustomer ? specialCustomerType : pickRandomNormalType());
    setCustomerAvatar(type, 'think');
    // 继续下一位顾客
    nextCustomer();
    currentAvatarType = null; // 清空以避免下一位复用
}

/* ========== 文本两段式拆分 ========== */
function splitDialogText(text){
    if (!text) return ["", null];
    // 以句末符号断句（中英文），保留原标点
    const parts = text
        .split(/(?<=[。！？!?；;…])/)
        .map(s=>s.trim())
        .filter(Boolean);
    if (parts.length <= 1) return [text, null];
    const mid = Math.ceil(parts.length/2);
    const first = parts.slice(0, mid).join('');
    const second = parts.slice(mid).join('');
    return [first, second || null];
}
/* ==========  下一顾客  ========== */
function nextCustomer(){
    customer++;
    if(customer>5){ 
        // 回合结束，重置特殊顾客状态
        specialCustomerSpawned = false;
        endRound(); 
        return; 
    }
    
    // 切换回游戏页面（前台）
    document.getElementById('kitchenPage').style.display = 'none';
    document.getElementById('gamePage').style.display = 'flex';
    
    updateUI();
    pendingDialog = null;
    document.getElementById('customerWords').textContent = getNextDialog();
    startPatience();
}

/* ==========  回合结束  ========== */
function endRound(){
    console.log('[endRound] 当前 round =', round);

    money -= RENT;
    let msg = `第 ${round} 回合结算\n💰 收入：${roundEarnings >= 0 ? '+' : ''}${roundEarnings}  ★ 声誉：${roundFame >= 0 ? '+' : ''}${roundFame}\n🏠 房租：-${RENT}\n\n💰 当前：${money}  ★ 声誉：${fame}`;

    if(money < 0) {
        showGameOverModal();
        return;
    }

    // ── 第 10 回合结算即触发结局 ──
    if(round >= 10) {
        const ending = getGameEnding(money, fame);
        showRoundEndModal(money, fame, ending);
        return;               // 重要：结局后不再继续
    }

    // ── 正常进入下一回合 ──
    roundEarnings = 0;
    roundFame     = 0;
    round++;      // 先加回合
    customer = 1; // 再重置顾客序号
    updateUI();
    showRoundSummaryModal(msg);   // 显示"第 X 回合结算"
    initRoundState();
    // 开启新回合的第一位顾客（而不是直接跳到第二位）
    document.getElementById('kitchenPage').style.display = 'none';
    document.getElementById('gamePage').style.display = 'flex';
    document.getElementById('customerWords').textContent = getNextDialog();
    startPatience();
}


/* ==========  失败离开  ========== */
function failCustomer(){
    let fameLoss = 5;
    fame = Math.max(0, fame - fameLoss);
    
    // 记录失败对声誉的影响
    roundFame -= fameLoss;
    
    updateUI();
    pendingDialog = null;
    nextCustomer();
}

/* ==========  音乐开关  ========== */
document.getElementById('musicToggle').onclick = function(){
    isMusicEnabled = !isMusicEnabled;
    this.innerText = isMusicEnabled ? '♪' : '♩';
    
    if (isMusicEnabled) {
        playBGM();
    } else {
        pauseBGM();
    }
};
/* ==========  顾客对话池  ========== */
function getNextDialog(){
    // 检查并解锁特殊配料
    checkSpecialCustomerIngredients();
    
    // 检查是否应该出现特殊顾客
    if (shouldSpawnSpecialCustomer()) {
        const special = getCurrentRoundSpecialCustomer();
        isSpecialCustomer = true;
        specialCustomerType = special.type;
        currentOrder = special.dish;
        specialCustomerSpawned = true; // 标记特殊顾客已出现
        
        // 更新顾客头像
        currentAvatarType = special.type;
        setCustomerAvatar(currentAvatarType, 'think');
        
        // 隐藏默认的进入后厨按钮（特殊顾客需要点击对话后才显示）
        const defaultBtn = document.getElementById('defaultEnterKitchenBtn');
        if (defaultBtn) {
            defaultBtn.style.display = 'none';
        }
        
        // 调整耐心时间（特殊顾客更耐心）
        patienceSec = 40;
        // 两段式点单文案
        const parts = splitDialogText(special.dialog);
        if (parts[1]) {
            pendingDialog = { part2: parts[1], emoji: null };
            // 为特殊顾客添加点击引导
            setTimeout(() => {
                addClickHint();
                // 为对话气泡添加视觉提示
                const wordsEl = document.getElementById('customerWords');
                if (wordsEl) {
                    wordsEl.classList.add('has-pending');
                }
            }, 1000); // 1秒后显示引导
        } else {
            pendingDialog = null;
        }
        return parts[0];
    } else {
        // 普通顾客
        isSpecialCustomer = false;
        specialCustomerType = null;
        
        // 显示默认的进入后厨按钮（普通顾客可以直接进入）
        const defaultBtn = document.getElementById('defaultEnterKitchenBtn');
        if (defaultBtn) {
            defaultBtn.style.display = 'inline-block';
        }
        
        patienceSec = 30;
        
        const orders = [
            {dialog: "今天加班好累…好想吃一份提拉米苏安慰一下自己。", dish: "提拉米苏"},
            {dialog: "天气太热了，来份抹茶千层清爽一下！", dish: "抹茶千层"},
            {dialog: "怀念家乡的苹果派，能帮我做一份吗？", dish: "苹果派"},
            {dialog: "马卡龙出片一定很棒，拜托来一份！", dish: "马卡龙"},
            {dialog: "焦糖布丁是我的最爱！", dish: "焦糖布丁"}
        ];
        const selectedOrder = orders[Math.floor(Math.random()*orders.length)];
        currentOrder = selectedOrder.dish;
        
        // 重置为普通顾客头像（从自动探测集合中随机）
        currentAvatarType = pickRandomNormalType();
        setCustomerAvatar(currentAvatarType, 'think');
        
        pendingDialog = null;
        return selectedOrder.dialog;
    }
}

/* ==========  页面加载完成后初始化  ========== */
document.addEventListener('DOMContentLoaded', function() {
    initBGM();
    initSoundEffects(); // 初始化音效系统
    
    // 添加双击音乐按钮切换BGM的功能
    document.getElementById('musicToggle').addEventListener('dblclick', function() {
        switchBGM();
    });
    // 点击气泡推进两段式
    const wordsEl = document.getElementById('customerWords');
    if (wordsEl) {
        wordsEl.addEventListener('click', function(){
            if (pendingDialog && pendingDialog.part2) {
                const prefix = pendingDialog.emoji ? (pendingDialog.emoji + ' ') : '';
                wordsEl.textContent = prefix + pendingDialog.part2;
                pendingDialog = null;
                
                // 移除点击引导和视觉提示
                removeClickHint();
                wordsEl.classList.remove('has-pending');
                
                // 根据当前页面状态显示相应按钮
                const gamePage = document.getElementById('gamePage');
                if (gamePage && gamePage.classList.contains('game-eval')) {
                    // 评价页：显示“好的”按钮
                    document.getElementById('evalOkBtn').style.display = 'inline-block';
                } else {
                    // 点单页：如果是特殊顾客，显示进入后厨按钮
                    if (isSpecialCustomer) {
                        showEnterKitchenButton();
                    }
                }
            }
        });
    }
});
/* ==========  显示成品图（统一入口）  ========== */
function showDishResult(dishName, quality) {
    const dishImage = document.getElementById('dishImage');
    const dishNameElement = document.getElementById('dishName');

    // 清空旧类
    dishImage.className = 'dish-image';

    if (!dishName) {
        // 黑暗料理
        dishImage.innerHTML = '';   // 先清空
        const img = new Image();
        img.src = 'images/dish_黑暗料理.webp';   // 放一张“黑暗料理”图
        img.alt = '黑暗料理';
        dishImage.appendChild(img);
        dishNameElement.textContent = '黑暗料理';
        dishImage.classList.add('wrong');
        return;
    }

    // 正常菜品 → 用图片
    dishImage.innerHTML = '';          // 先清空
    const img = new Image();
    img.src = `images/dish_${dishName}.webp`;   // 关键：按名字拼路径
    img.alt = dishName;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';     // 保持比例填满
    dishImage.appendChild(img);

    dishNameElement.textContent = dishName + ' (' + ['失败', '良好', '完美'][quality] + ')';

    // 边框颜色
    const classMap = ['wrong', 'good', 'perfect'];
    dishImage.classList.add(classMap[quality]);
}

// 获取所有菜谱（包括已解锁的专属菜品）
function getAllRecipes() {
    const allRecipes = [...recipes];
    
    // 添加所有特殊菜品（无论是否解锁）
    specialCustomers.forEach(special => {
        allRecipes.push({
            name: special.dish,
            ingr: special.ingredients,
            price: special.price,
            fame: special.fame
        });
    });
    
    return allRecipes;
}

// 获取菜谱显示文本（未解锁的显示？？？）
function getRecipeDisplayText() {
    const allRecipes = getAllRecipes();
    const specialDishes = specialCustomers.map(sc => sc.dish);
    
    console.log('当前回合:', round);
    console.log('特殊菜品:', specialDishes);
    console.log('所有菜谱:', allRecipes);
    
    return allRecipes.map(recipe => {
        if (specialDishes.includes(recipe.name)) {
            // 检查特殊顾客是否已到来
            const special = specialCustomers.find(sc => sc.dish === recipe.name);
            if (special && round >= special.round) {
                // 特殊顾客已到来，显示菜谱
                console.log(`${recipe.name} 已解锁，显示菜谱`);
                return `${recipe.name} = ${recipe.ingr.join('+')}`;
            } else {
                // 特殊顾客未到来，显示？？？
                console.log(`${recipe.name} 未解锁，显示???`);
                return `${recipe.name} = ???`;
            }
        } else {
            // 普通菜品
            return `${recipe.name} = ${recipe.ingr.join('+')}`;
        }
    }).join('\n');
}
/* ========== 立绘切换器 ========== */
// 规则：普通顾客立绘放在 images/ 目录，命名为：
// customer1_think.webp / customer1_happy.webp / customer1_angry.webp
// customer2_think.webp / ...
// 数量不限；系统将自动探测 1..NORMAL_AVATAR_MAX 的存在情况
const NORMAL_AVATAR_PREFIX = 'customer';
const NORMAL_AVATAR_MAX = 6; // 根据实际图片数量调整
const normalAvatarKeys = [];  // e.g. ['normal-1','normal-2']

const avatarMap = {
    // 预置两个普通顾客作兜底（当未放入任何 customerN_* 时使用）
    '普通-学生': ['customer1_think.webp','customer1_happy.webp','customer1_angry.webp'],
    '普通-上班族': ['customer2_think.webp','customer2_happy.webp','customer2_angry.webp'],
    // 特殊顾客
    'food_blogger': ['blogger_think.webp','blogger_happy.webp','blogger_angry.webp'],
    'french_tourist': ['tourist_think.webp','tourist_happy.webp','tourist_angry.webp'],
    'couple': ['couple_think.webp','couple_happy.webp','couple_angry.webp']
};

// 探测普通顾客立绘：检查 images/customer{i}_think.webp 是否存在
function detectNormalAvatars() {
    const checks = [];
    for (let i = 1; i <= NORMAL_AVATAR_MAX; i++) {
        checks.push(new Promise(resolve => {
            const img = new Image();
            img.onload = () => {
                const key = `normal-${i}`;
                normalAvatarKeys.push(key);
                avatarMap[key] = [
                    `${NORMAL_AVATAR_PREFIX}${i}_think.webp`,
                    `${NORMAL_AVATAR_PREFIX}${i}_happy.webp`,
                    `${NORMAL_AVATAR_PREFIX}${i}_angry.webp`
                ];
                resolve(true);
            };
            img.onerror = () => resolve(false);
            img.src = `images/${NORMAL_AVATAR_PREFIX}${i}_think.webp`;
        }));
    }
    return Promise.all(checks).then(() => {
        console.log('普通顾客立绘探测完成：', normalAvatarKeys);
    });
}

function pickRandomNormalType() {
    if (normalAvatarKeys.length > 0) {
        return normalAvatarKeys[Math.floor(Math.random() * normalAvatarKeys.length)];
    }
    // 兜底：使用原有两类
    const fallback = ['普通-学生', '普通-上班族'];
    return fallback[Math.floor(Math.random() * fallback.length)];
}

// 前台：提需求 → think
function setCustomerAvatar(type, mood = 'think') {
    const list = avatarMap[type] || avatarMap['普通-上班族'];
    const moodIndex = mood === 'think' ? 0 : (mood === 'happy' ? 1 : 2);
    const path = 'images/' + list[moodIndex];
    console.log('[Avatar] 尝试加载:', path); 
    const img = document.querySelector('.customer-avatar');
    if (!img) return;
    img.onerror = () => {
        // 回退：若失败，尝试 transparent.webp，再次失败则移除错误监听
        img.onerror = null;
        img.src = 'images/transparent.webp';
    };
    img.src = path;
    // 记录本次顾客的立绘类型，保证点单与评价一致
    img.dataset.avatarType = type;
    currentAvatarType = type;
}

// 评价页：根据结果 → happy / angry
function setEvalAvatar(type, result) {
    const list = avatarMap[type] || avatarMap['普通-上班族'];
    const idx = result === 2 ? 1 : (result === 1 ? 1 : 2); // 2=开心 1=开心 0=生气
    const img = document.querySelector('.customer-avatar');
    if (!img) return;
    img.onerror = () => {
        img.onerror = null;
        img.src = 'images/transparent.webp';
    };
    img.src = 'images/' + list[idx];
}

function preloadFirstAvatar() {
    const img = new Image();
    img.src = 'images/customer1_think.webp';
}

// 统一拿价格
function getDishPrice(name) {
    const sp = specialCustomers.find(sc => sc.dish === name);
    if (sp) return sp.price;
    const rc = recipes.find(r => r.name === name);
    return rc ? rc.price : 35;   // 兜底 35
}

// 统一拿声誉
function getDishFame(name) {
    const sp = specialCustomers.find(sc => sc.dish === name);
    if (sp) return sp.fame;
    const rc = recipes.find(r => r.name === name);
    return rc ? rc.fame : 3;     // 兜底 3
}

// 调试功能：跳过当前回合
function skipRound() {
    console.log('=== 跳过回合按钮被点击 ===');
    console.log('跳过回合 - 调试模式');
    console.log('当前回合:', round);
    console.log('当前顾客:', customerNo);
    
    // 模拟跳过回合的逻辑
    if (round >= 10) {
        const ending = getGameEnding(money, fame);
        showRoundEndModal(money, fame, ending);
        return;
    }
    
    // 正常进入下一回合
    roundEarnings = 0;
    roundFame = 0;
    round++;
    customer = 1;
    updateUI();
    
    // 显示跳过消息
    const skipMsg = document.createElement('div');
    skipMsg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 20px;
        border-radius: 10px;
        font-size: 18px;
        z-index: 10000;
        text-align: center;
    `;
    skipMsg.textContent = '回合已跳过！';
    document.body.appendChild(skipMsg);
    
    setTimeout(() => {
        if (skipMsg.parentNode) {
            skipMsg.parentNode.removeChild(skipMsg);
        }
        nextCustomer();
    }, 2000);
}

// 调试功能：测试完美制作
function testPerfect() {
    console.log('=== 测试完美制作 ===');
    if (currentOrder) {
        // 设置烘焙结果为完美
        bakeResult = 2;
        
        // 直接显示评价，不重复计算
        showEvalDirect(currentOrder, 2);
    } else {
        console.log('没有当前订单');
    }
}

// 调试功能：测试普通制作
function testGood() {
    console.log('=== 测试普通制作 ===');
    if (currentOrder) {
        // 设置烘焙结果为良好
        bakeResult = 1;
        
        // 直接显示评价，不重复计算
        showEvalDirect(currentOrder, 1);
    } else {
        console.log('没有当前订单');
    }
}

// 调试功能：测试失败制作
function testFail() {
    console.log('=== 测试失败制作 ===');
    // 设置烘焙结果为失败
    bakeResult = 0;
    
    // 直接显示评价，不重复计算
    showEvalDirect('黑暗料理', 0);
}

// 调试专用：直接显示评价，不重新计算数值
function showEvalDirect(dishName, finalResult) {
    console.log('=== 直接显示评价 ===');
    console.log('菜品:', dishName, '结果:', finalResult);
    
    // 计算收入和声誉（只计算一次）
    let earn, f;
    
    if (finalResult === 0) {
        // 烘焙失败：不给金钱，扣除声誉
        earn = 0;
        f = -3;
    } else {
        // 烘焙成功：正常计算
        let mult = [0, 1.0, 1.2][finalResult];
        earn = Math.floor((dishName ? getDishPrice(dishName) : 40) * mult);
        f = (dishName ? getDishFame(dishName) : 4) + (finalResult === 2 ? 3 : 0);
    }
    
    if (!dishName) f = -2;
    
    // 更新数值
    money += earn;
    fame += f;
    roundEarnings += earn;
    roundFame += f;
    
    console.log('最终收入:', earn, '最终声誉:', f);
    
    // 显示评价界面
    const game = document.getElementById('gamePage');
    if (game) game.style.display = 'flex';
    game.classList.add('game-eval');
    document.getElementById('dishResult').style.display = 'flex';
    
    // 如果有第二段对话，隐藏“好的”按钮并添加引导
    if (pendingDialog && pendingDialog.part2) {
        document.getElementById('evalOkBtn').style.display = 'none';
        // 为评价页添加点击引导
        setTimeout(() => {
            addClickHint();
            // 为对话气泡添加视觉提示
            const wordsEl = document.getElementById('customerWords');
            if (wordsEl) {
                wordsEl.classList.add('has-pending');
            }
        }, 1000); // 1秒后显示引导
    } else {
        // 没有第二段对话，直接显示“好的”按钮
        document.getElementById('evalOkBtn').style.display = 'inline-block';
    }
    
    // 显示成品图
    showDishResult(dishName, finalResult);
    
    // 更新UI
    updateUI();
    
    // 显示回合收入动画
    showRoundEarnings(earn, f);
}

// 调试功能：跳过当前回合
function skipRound() {
    console.log('=== 跳过回合按钮被点击 ===');
    console.log('跳过回合 - 调试模式');
    console.log('当前回合:', round);
    console.log('当前顾客:', customer);
    
    // 检查当前在哪个页面
    const gamePage = document.getElementById('gamePage');
    const kitchenPage = document.getElementById('kitchenPage');
    const titlePage = document.getElementById('titlePage');
    
    let currentPage = 'unknown';
    if (gamePage.style.display !== 'none') currentPage = 'game';
    else if (kitchenPage.style.display !== 'none') currentPage = 'kitchen';
    else if (titlePage.style.display !== 'none') currentPage = 'title';
    
    console.log('当前页面:', currentPage);
    
    // 模拟完成当前回合
    if (currentPage === 'kitchen') {
        // 如果在后厨，直接返回前台
        document.getElementById('kitchenPage').style.display = 'none';
        document.getElementById('gamePage').style.display = 'flex';
    }
    
    // 模拟顾客满意，获得奖励
    const moneyGain = Math.floor(Math.random() * 50) + 20; // 20-70金币
    const fameGain = Math.floor(Math.random() * 3) + 1;    // 1-3声誉
    
    money += moneyGain;
    fame += fameGain;
    updateUI();
    
    // 显示跳过提示
    const skipMsg = document.createElement('div');
    skipMsg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 20px;
        border-radius: 10px;
        font-size: 18px;
        z-index: 10000;
        text-align: center;
    `;
    skipMsg.innerHTML = `
        <div>🎉 回合已跳过！</div>
        <div>💰 +${moneyGain} 金币</div>
        <div>⭐ +${fameGain} 声誉</div>
    `;
    document.body.appendChild(skipMsg);
    
    // 2秒后移除提示并进入下一个顾客
    setTimeout(() => {
        if (skipMsg.parentNode) {
            skipMsg.parentNode.removeChild(skipMsg);
        }
        // 使用游戏原有的逻辑进入下一个顾客
        nextCustomer();
    }, 2000);
}

/* ==========  显示回合收入动画  ========== */
function showRoundEarnings(earn, fame) {
    // 创建动画容器
    const earningsContainer = document.createElement('div');
    earningsContainer.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10000;
        pointer-events: none;
        text-align: center;
        font-family: sans-serif;
    `;
    
    // 创建金币动画元素
    if (earn > 0) {
        const moneyElement = document.createElement('div');
        moneyElement.style.cssText = `
            color: #ffd700;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
            opacity: 1;
            transform: translateY(0);
            transition: all 2s ease-out;
        `;
        moneyElement.textContent = `+${earn} 💰`;
        earningsContainer.appendChild(moneyElement);
    }
    
    // 创建声誉动画元素
    if (fame > 0) {
        const fameElement = document.createElement('div');
        fameElement.style.cssText = `
            color: #ff6b6b;
            font-size: 24px;
            font-weight: bold;
            opacity: 1;
            transform: translateY(0);
            transition: all 2s ease-out;
        `;
        fameElement.textContent = `+${fame} ⭐`;
        earningsContainer.appendChild(fameElement);
    }
    
    // 添加到页面
    document.body.appendChild(earningsContainer);
    
    // 触发动画
    setTimeout(() => {
        const elements = earningsContainer.querySelectorAll('div');
        elements.forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(-50px)';
        });
    }, 100);
    
    // 2秒后移除元素
    setTimeout(() => {
        if (earningsContainer.parentNode) {
            earningsContainer.parentNode.removeChild(earningsContainer);
        }
    }, 2100);
}