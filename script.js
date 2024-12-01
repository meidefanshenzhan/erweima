document.addEventListener('DOMContentLoaded', function() {
    const urlInput = document.getElementById('urlInput');
    const generateBtn = document.getElementById('generateBtn');
    const qrCanvas = document.getElementById('qrCode');
    const downloadBtn = document.getElementById('downloadBtn');
    const logoUpload = document.getElementById('logoUpload');
    const optionBtns = document.querySelectorAll('.option-btn');
    const loadingSpinner = document.querySelector('.loading-spinner');
    const logoSizeSlider = document.getElementById('logoSizeSlider');
    const customLogoSize = document.getElementById('customLogoSize');

    let currentLogo = null;
    let currentLogoOption = 'none';
    let currentLogoSize = 0.2; // 默认 Logo 大小为二维码的 20%

    // 初始状态下禁用下载按钮
    downloadBtn.disabled = true;
    downloadBtn.style.opacity = '0.5';
    downloadBtn.style.cursor = 'not-allowed';

    // 监听生成按钮点击
    generateBtn.addEventListener('click', generateQRCode);

    // 监听回车键
    urlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            generateQRCode();
        }
    });

    // 监听Logo选项切换
    optionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            optionBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentLogoOption = this.dataset.option;

            if (currentLogoOption === 'custom') {
                logoUpload.click();
            } else if (urlInput.value.trim()) {
                generateQRCode();
            }
        });
    });

    // 监听文件上传
    logoUpload.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                currentLogo = e.target.result;
                if (urlInput.value.trim()) {
                    generateQRCode();
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });

    // 添加滑块和输入框的事件监听
    logoSizeSlider.addEventListener('input', handleLogoSizeChange);
    customLogoSize.addEventListener('input', handleCustomLogoSizeInput);

    // 生成二维码函数
    async function generateQRCode() {
        const url = urlInput.value.trim();
        if (!url) {
            alert('请输入有效的网址！');
            return;
        }

        showLoading(true);
        downloadBtn.disabled = true;
        downloadBtn.style.opacity = '0.5';
        downloadBtn.style.cursor = 'not-allowed';

        try {
            // 清除旧的二维码
            qrCanvas.innerHTML = '';
            
            // 创建新的二维码
            new QRCode(qrCanvas, {
                text: url,
                width: 256,
                height: 256,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });

            // 等待二维码生成完成
            await new Promise(resolve => setTimeout(resolve, 100));

            // 处理Logo
            if (currentLogoOption === 'auto') {
                try {
                    const domain = new URL(url).hostname;
                    const favicon = `https://icon.horse/icon/${domain}`;
                    await addLogoToQR(favicon);
                } catch (error) {
                    console.error('获取网站Logo失败:', error);
                }
            } else if (currentLogoOption === 'custom' && currentLogo) {
                await addLogoToQR(currentLogo);
            }

            // 启用下载按钮
            downloadBtn.disabled = false;
            downloadBtn.style.opacity = '1';
            downloadBtn.style.cursor = 'pointer';

        } catch (error) {
            console.error('生成二维码失败:', error);
            alert('生成二维码失败，请重试！');
        } finally {
            showLoading(false);
        }
    }

    // 添加Logo到二维码
    async function addLogoToQR(logoUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function() {
                const qrImg = qrCanvas.querySelector('img');
                if (!qrImg) {
                    reject(new Error('QR code image not found'));
                    return;
                }

                const canvas = document.createElement('canvas');
                const size = 256; // 固定二维码大小
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');

                // 绘制二维码
                ctx.drawImage(qrImg, 0, 0, size, size);

                // 使用当前 Logo 大小比例计算 Logo 尺寸
                const logoSize = size * currentLogoSize;
                const x = (size - logoSize) / 2;
                const y = (size - logoSize) / 2;

                // 绘制白色背景圈
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(x + logoSize/2, y + logoSize/2, logoSize/2 + 2, 0, Math.PI * 2);
                ctx.fill();

                // 绘制 Logo
                ctx.save();
                ctx.beginPath();
                ctx.arc(x + logoSize/2, y + logoSize/2, logoSize/2, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(img, x, y, logoSize, logoSize);
                ctx.restore();

                // 替换原来的二维码图片
                qrImg.src = canvas.toDataURL('image/png');
                resolve();
            };
            img.onerror = reject;
            img.src = logoUrl;
        });
    }

    // 下载二维码
    downloadBtn.addEventListener('click', function() {
        const customSizeInput = document.getElementById('customSize');
        let size = parseInt(sizeSelect.value);
        
        // 检查是否有自定义尺寸
        if (customSizeInput.value) {
            size = Math.min(Math.max(parseInt(customSizeInput.value), 128), 1024);
        }

        // 获取当前显示的二维码图片
        const qrImg = qrCanvas.querySelector('img');
        if (!qrImg) return;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = size;
        tempCanvas.height = size;
        
        const ctx = tempCanvas.getContext('2d');
        // 使用白色背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        // 绘制二维码
        ctx.drawImage(qrImg, 0, 0, size, size);

        // 创建下载链接
        const link = document.createElement('a');
        link.download = 'qrcode.png';
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
    });

    // 工具函数
    function showLoading(show) {
        loadingSpinner.style.display = show ? 'flex' : 'none';
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 更新 Logo 获取函数
    async function getFavicon(url) {
        try {
            // 首先尝试获取高清 favicon
            const domain = new URL(url).hostname;
            const iconUrl = `https://icon.horse/icon/${domain}`;
            
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve(img.src);
                img.onerror = () => {
                    // 如果失败，尝试 Google 的 favicon 服务
                    const googleFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
                    resolve(googleFavicon);
                };
                img.src = iconUrl;
            });
        } catch (error) {
            console.error('获取网站图标失败:', error);
            throw error;
        }
    }

    // 更新显示/隐藏默认提示的逻辑
    function updatePreviewVisibility(isGenerating) {
        const defaultTip = document.querySelector('.default-tip');
        const qrCode = document.getElementById('qrCode');
        
        if (isGenerating) {
            defaultTip.style.display = 'none';
            qrCode.style.display = 'flex';
        } else {
            defaultTip.style.display = 'flex';
            qrCode.style.display = 'none';
        }
    }

    // 添加错误处理时显示默认提示
    function handleError() {
        updatePreviewVisibility(false);
        // ... 其他错误处理逻辑 ...
    }

    // 处理滑块改变
    function handleLogoSizeChange(e) {
        currentLogoSize = parseFloat(e.target.value);
        customLogoSize.value = Math.round(currentLogoSize * 100);
        if (currentLogoOption !== 'none') {
            generateQRCode(); // 重新生成二维码和 Logo
        }
    }

    // 处理自定义输入
    function handleCustomLogoSizeInput(e) {
        let value = parseInt(e.target.value);
        if (isNaN(value)) value = 20;
        value = Math.min(Math.max(value, 10), 30); // 限制在 10-30% 之间
        
        currentLogoSize = value / 100;
        logoSizeSlider.value = currentLogoSize;
        e.target.value = value;
        if (currentLogoOption !== 'none') {
            generateQRCode(); // 重新生成二维码和 Logo
        }
    }
}); 