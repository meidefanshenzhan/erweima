document.addEventListener('DOMContentLoaded', function() {
    const urlInput = document.getElementById('urlInput');
    const generateBtn = document.getElementById('generateBtn');
    const qrCanvas = document.getElementById('qrCode');
    const downloadBtn = document.getElementById('downloadBtn');
    const logoUpload = document.getElementById('logoUpload');
    const optionBtns = document.querySelectorAll('.option-btn');
    const loadingSpinner = document.querySelector('.loading-spinner');
    const defaultTip = document.querySelector('.default-tip');
    const logoSizeSlider = document.getElementById('logoSizeSlider');
    const customLogoSize = document.getElementById('customLogoSize');

    let currentLogo = null;
    let currentLogoOption = 'none';
    let currentLogoSize = 0.2;

    // 生成二维码函数
    async function generateQRCode() {
        const url = urlInput.value.trim();
        if (!url) {
            alert('请输入有效的网址！');
            return;
        }

        showLoading(true);
        downloadBtn.disabled = true;
        
        // 隐藏默认提示
        if (defaultTip) {
            defaultTip.style.display = 'none';
        }

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
            // 如果生成失败，显示默认提示
            if (defaultTip) {
                defaultTip.style.display = 'flex';
            }
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
                const size = 256;
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');

                // 绘制二维码
                ctx.drawImage(qrImg, 0, 0, size, size);

                // 使用当前Logo大小比例
                const logoSize = size * currentLogoSize;
                const x = (size - logoSize) / 2;
                const y = (size - logoSize) / 2;

                // 绘制白色背景
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(x + logoSize/2, y + logoSize/2, logoSize/2 + 2, 0, Math.PI * 2);
                ctx.fill();

                // 绘制Logo
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

    // 显示/隐藏加载动画
    function showLoading(show) {
        if (loadingSpinner) {
            loadingSpinner.style.display = show ? 'flex' : 'none';
        }
    }

    // 事件监听
    generateBtn.addEventListener('click', generateQRCode);

    urlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            generateQRCode();
        }
    });

    // Logo选项切换
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

    // Logo大小调整
    logoSizeSlider.addEventListener('input', function(e) {
        currentLogoSize = parseFloat(e.target.value);
        customLogoSize.value = Math.round(currentLogoSize * 100);
        if (currentLogoOption !== 'none' && urlInput.value.trim()) {
            generateQRCode();
        }
    });

    customLogoSize.addEventListener('input', function(e) {
        let value = parseInt(e.target.value);
        if (isNaN(value)) value = 20;
        value = Math.min(Math.max(value, 10), 30);
        
        currentLogoSize = value / 100;
        logoSizeSlider.value = currentLogoSize;
        if (currentLogoOption !== 'none' && urlInput.value.trim()) {
            generateQRCode();
        }
    });

    // 文件上传处理
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
}); 