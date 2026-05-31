(function() {
    // 全局变量
    let mailData = [];
    let currentMailPage = 1;
    const mailItemsPerPage = 10;
    let currentPage = 1;
    let itemsPerPage = 5;
    let selectedItems = [];
    let allEmailData = [];
    let currentSearchKeyword = '';
    let filteredEmailData = [];

    // 移动端侧边栏
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    function openSidebar() { sidebar.classList.add('open'); sidebarOverlay.classList.add('active'); }
    function closeSidebar() { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('active'); }
    mobileMenuToggle.addEventListener('click', openSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);
    document.querySelectorAll('.sidebar ul li a').forEach(link => {
        link.addEventListener('click', () => { if (window.innerWidth <= 1024) closeSidebar(); });
    });

    function showLoading() { document.getElementById('loading-overlay').style.display = 'flex'; }
    function hideLoading() { document.getElementById('loading-overlay').style.display = 'none'; }

    // 侧边栏切换
    document.querySelectorAll('.sidebar ul li a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.sidebar ul li a').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            const targetId = link.getAttribute('data-target');
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
        });
    });

    function applySearchAndRender() {
        const keyword = currentSearchKeyword.trim().toLowerCase();
        filteredEmailData = keyword === '' ? [...allEmailData] : allEmailData.filter(item => item.email.toLowerCase().includes(keyword));
        currentPage = 1;
        renderTableByData(filteredEmailData);
        renderPaginationByData(filteredEmailData);
        toggleNoData(filteredEmailData.length === 0);
        updateSelectAllCheckbox();
    }

    function renderTableByData(dataArray) {
        const tbody = document.querySelector('#email-table tbody');
        tbody.innerHTML = '';
        const start = (currentPage - 1) * itemsPerPage;
        const pageData = dataArray.slice(start, start + itemsPerPage);
        pageData.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" data-email="${escapeHtml(item.email)}"></td>
                <td>${escapeHtml(item.email)}</td>
                <td>${escapeHtml(item.password)}</td>
                <td>${escapeHtml(item.clientId)}</td>
                <td class="refresh-token" title="${escapeHtml(item.refreshToken)}">${escapeHtml(item.refreshToken)}</td>
                <td class="actions">
                    <button class="btn btn-view" onclick="viewInboxByEmail('${escapeHtml(item.email)}')"><i class="fas fa-inbox"></i> 收件箱</button>
                    <button class="btn btn-view" onclick="viewJunkByEmail('${escapeHtml(item.email)}')"><i class="fas fa-ban"></i> 垃圾箱</button>
                    <button class="btn btn-delete" onclick="deleteEmailByEmail('${escapeHtml(item.email)}')"><i class="fas fa-trash-alt"></i> 删除</button>
                </td>`;
            tbody.appendChild(row);
        });
        attachCheckboxEvents();
    }

    function attachCheckboxEvents() {
        document.querySelectorAll('#email-table tbody input[type="checkbox"]').forEach(cb => {
            cb.removeEventListener('change', updateSelectedItems);
            cb.addEventListener('change', updateSelectedItems);
        });
        updateSelectedItems();
    }

    function updateSelectedItems() {
        selectedItems = Array.from(document.querySelectorAll('#email-table tbody input[type="checkbox"]:checked')).map(cb => cb.dataset.email);
        updateSelectAllCheckbox();
    }

    function updateSelectAllCheckbox() {
        const selectAll = document.getElementById('select-all');
        if (!selectAll) return;
        const total = document.querySelectorAll('#email-table tbody input[type="checkbox"]').length;
        const checked = document.querySelectorAll('#email-table tbody input[type="checkbox"]:checked').length;
        selectAll.checked = total > 0 && checked === total;
        selectAll.indeterminate = checked > 0 && checked < total;
    }

    document.getElementById('select-all').addEventListener('change', function() {
        document.querySelectorAll('#email-table tbody input[type="checkbox"]').forEach(cb => cb.checked = this.checked);
        updateSelectedItems();
    });

    function renderPaginationByData(dataArray) {
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = '';
        const totalPages = Math.ceil(dataArray.length / itemsPerPage);
        if (totalPages === 0) return;
        const maxButtons = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);
        if (endPage - startPage + 1 < maxButtons) startPage = Math.max(1, endPage - maxButtons + 1);
        if (currentPage > 1) {
            const prev = document.createElement('button'); prev.textContent = '上一页';
            prev.onclick = () => { currentPage--; renderTableByData(filteredEmailData); renderPaginationByData(filteredEmailData); };
            pagination.appendChild(prev);
        }
        if (startPage > 1) {
            const first = document.createElement('button'); first.textContent = '1';
            first.onclick = () => { currentPage = 1; renderTableByData(filteredEmailData); renderPaginationByData(filteredEmailData); };
            pagination.appendChild(first);
            if (startPage > 2) { const dots = document.createElement('span'); dots.textContent = '...'; pagination.appendChild(dots); }
        }
        for (let i = startPage; i <= endPage; i++) {
            const btn = document.createElement('button'); btn.textContent = i;
            if (i === currentPage) btn.classList.add('active');
            btn.onclick = () => { currentPage = i; renderTableByData(filteredEmailData); renderPaginationByData(filteredEmailData); };
            pagination.appendChild(btn);
        }
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) { const dots = document.createElement('span'); dots.textContent = '...'; pagination.appendChild(dots); }
            const last = document.createElement('button'); last.textContent = totalPages;
            last.onclick = () => { currentPage = totalPages; renderTableByData(filteredEmailData); renderPaginationByData(filteredEmailData); };
            pagination.appendChild(last);
        }
        if (currentPage < totalPages) {
            const next = document.createElement('button'); next.textContent = '下一页';
            next.onclick = () => { currentPage++; renderTableByData(filteredEmailData); renderPaginationByData(filteredEmailData); };
            pagination.appendChild(next);
        }
    }

    window.changePage = (page) => { currentPage = page; renderTableByData(filteredEmailData); renderPaginationByData(filteredEmailData); };
    window.changeItemsPerPage = (value) => { itemsPerPage = parseInt(value, 10); currentPage = 1; renderTableByData(filteredEmailData); renderPaginationByData(filteredEmailData); };

    function toggleNoData(isEmpty) { document.getElementById('no-data').style.display = isEmpty ? 'block' : 'none'; }
    function updateDashboard(data) { document.getElementById('account-count').textContent = data.length; }

    function reloadAllData() {
        allEmailData = JSON.parse(localStorage.getItem('emailData')) || [];
        updateDashboard(allEmailData);
        applySearchAndRender();
    }

    window.deleteEmailByEmail = (email) => {
        if (!confirm(`确定要删除邮箱 ${email} 吗？`)) return;
        allEmailData = allEmailData.filter(item => item.email !== email);
        localStorage.setItem('emailData', JSON.stringify(allEmailData));
        reloadAllData();
        showModal('删除成功', `邮箱 ${email} 已删除。`);
    };

    window.viewInboxByEmail = async (email) => {
        const item = allEmailData.find(i => i.email === email);
        if (!item) { showModal('错误', '未找到邮箱数据'); return; }
        currentMailPage = 1;
        await loadMailList(item.refreshToken, item.clientId, item.email, 'INBOX');
    };
    window.viewJunkByEmail = async (email) => {
        const item = allEmailData.find(i => i.email === email);
        if (!item) { showModal('错误', '未找到邮箱数据'); return; }
        currentMailPage = 1;
        await loadMailList(item.refreshToken, item.clientId, item.email, 'Junk');
    };

    window.batchDelete = () => {
        if (selectedItems.length === 0) { alert('请选择要删除的项！'); return; }
        if (!confirm(`确定要删除选中的 ${selectedItems.length} 项吗？`)) return;
        allEmailData = allEmailData.filter(item => !selectedItems.includes(item.email));
        localStorage.setItem('emailData', JSON.stringify(allEmailData));
        reloadAllData();
        showModal('批量删除', `成功删除 ${selectedItems.length} 项。`);
        selectedItems = [];
    };

    function loadMailList(refreshToken, clientId, email, mailbox) {
        showLoading();
        const password = localStorage.getItem('password') || '';
        fetch(`/api/mail-all?refresh_token=${refreshToken}&client_id=${clientId}&email=${email}&mailbox=${mailbox}&response_type=json&password=${password}`)
            .then(response => {
                if (!response.ok) {
                    if (response.status === 500) return response.json().then(err => {
                        if (err.error === "Nothing to fetch") {
                            mailData = [];
                            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
                            document.getElementById('mail-list').classList.add('active');
                            renderMailTable(mailData);
                            return;
                        } else throw new Error('服务器内部错误');
                    });
                    else if (response.status === 401) throw response;
                    else throw new Error(`请求失败，状态码：${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data) {
                    mailData = data;
                    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
                    document.getElementById('mail-list').classList.add('active');
                    renderMailTable(mailData);
                }
            })
            .catch(error => {
                if (error.status === 401) showModal('提示', '为了防止滥用，已增加密码验证功能。如需使用，请联系管理员获取密码或自行搭建服务。');
                else showModal('错误', error.message.includes('服务器') ? '服务器内部错误，请稍后重试。' : '该邮箱未授权，请联系管理员或在此购买。');
            })
            .finally(() => hideLoading());
    }

    function renderMailTable(data) {
        const tbody = document.querySelector('#mail-table tbody');
        tbody.innerHTML = '';
        document.getElementById('no-data-mail').style.display = data.length === 0 ? 'block' : 'none';
        const start = (currentMailPage - 1) * mailItemsPerPage;
        const pageData = data.slice(start, start + mailItemsPerPage);
        pageData.forEach((item, idx) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${escapeHtml(item.send)}</td>
                <td>${escapeHtml(item.subject)}</td>
                <td>${escapeHtml(item.date)}</td>
                <td class="actions"><button class="btn btn-view" onclick="viewMail(${start + idx})"><i class="fas fa-eye"></i> 查看</button></td>`;
            tbody.appendChild(row);
        });
        renderMailPagination(data.length);
    }

    function renderMailPagination(totalItems) {
        const pagination = document.getElementById('pagination-mail');
        pagination.innerHTML = '';
        const totalPages = Math.ceil(totalItems / mailItemsPerPage);
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button'); btn.textContent = i;
            if (i === currentMailPage) btn.classList.add('active');
            btn.onclick = () => { currentMailPage = i; renderMailTable(mailData); };
            pagination.appendChild(btn);
        }
    }

    window.changeMailPage = (page) => { currentMailPage = page; renderMailTable(mailData); };

    window.viewMail = (index) => {
        const item = mailData[index];
        if (item) {
            document.getElementById('mail-modal-title').textContent = item.subject;
            document.getElementById('mail-modal-sender').textContent = `发件人: ${item.send}`;
            document.getElementById('mail-modal-subject').textContent = `主题: ${item.subject}`;
            document.getElementById('mail-modal-date').textContent = `日期: ${item.date}`;
            document.getElementById('mail-modal-content').innerHTML = item.html || item.text || '(无内容)';
            document.getElementById('mail-modal').style.display = 'flex';
        }
    };

    window.closeMailModal = () => { document.getElementById('mail-modal').style.display = 'none'; };

    window.importEmails = () => {
        const delimiter = document.getElementById('delimiter').value.trim();
        const fileInput = document.getElementById('file-input');
        if (!delimiter) { showModal('错误', '请输入分隔符！'); return; }
        if (fileInput.files.length === 0) { showModal('错误', '请选择文件！'); return; }
        const reader = new FileReader();
        reader.onload = (e) => {
            const lines = e.target.result.split('\n');
            let data = JSON.parse(localStorage.getItem('emailData')) || [];
            let importCount = 0, skipCount = 0;
            lines.forEach(line => {
                const fields = line.split(delimiter);
                if (fields.length >= 4) {
                    const [email, password, clientId, refreshToken] = fields.map(f => f.trim());
                    if (email && password && clientId && refreshToken) {
                        if (!data.some(item => item.email.toLowerCase() === email.toLowerCase())) {
                            data.push({ email, password, clientId, refreshToken });
                            importCount++;
                        } else skipCount++;
                    }
                }
            });
            localStorage.setItem('emailData', JSON.stringify(data));
            document.getElementById('searchEmailInput').value = '';
            currentSearchKeyword = '';
            document.getElementById('clearSearchBtn').style.display = 'none';
            reloadAllData();
            showModal('导入成功', `成功导入 ${importCount} 条，跳过 ${skipCount} 条重复。`);
        };
        reader.readAsText(fileInput.files[0]);
    };

    window.openPasteModal = () => { document.getElementById('paste-modal').style.display = 'flex'; };
    window.closePasteModal = () => { document.getElementById('paste-modal').style.display = 'none'; };

    window.importFromPaste = () => {
        const text = document.getElementById('paste-textarea').value.trim();
        const delimiter = document.getElementById('paste-delimiter').value.trim();
        if (!text) { showModal('错误', '请粘贴数据！'); return; }
        if (!delimiter) { showModal('错误', '请输入分隔符！'); return; }
        const lines = text.split('\n');
        let data = JSON.parse(localStorage.getItem('emailData')) || [];
        let importCount = 0, skipCount = 0;
        lines.forEach(line => {
            if (!line.trim()) return;
            const fields = line.split(delimiter);
            if (fields.length >= 4) {
                const [email, password, clientId, refreshToken] = fields.map(f => f.trim());
                if (email && password && clientId && refreshToken) {
                    if (!data.some(item => item.email.toLowerCase() === email.toLowerCase())) {
                        data.push({ email, password, clientId, refreshToken });
                        importCount++;
                    } else skipCount++;
                }
            }
        });
        if (importCount > 0) {
            localStorage.setItem('emailData', JSON.stringify(data));
            document.getElementById('searchEmailInput').value = '';
            currentSearchKeyword = '';
            document.getElementById('clearSearchBtn').style.display = 'none';
            reloadAllData();
            showModal('导入成功', `成功导入 ${importCount} 条，跳过 ${skipCount} 条重复。`);
        } else {
            showModal('提示', skipCount ? '所有邮箱均已存在，未导入新数据。' : '未能解析有效数据，请检查格式和分隔符。');
        }
        closePasteModal();
    };

    window.exportData = () => {
        if (allEmailData.length === 0) { showModal('提示', '当前没有可以导出的数据。'); return; }
        const delimiter = document.getElementById('delimiter').value.trim() || '----';
        const lines = allEmailData.map(item => [item.email, item.password, item.clientId, item.refreshToken].join(delimiter));
        const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `邮箱数据_${new Date().toISOString().slice(0,10)}.txt`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showModal('导出成功', `已导出 ${allEmailData.length} 条邮箱数据。`);
    };

    // 拖拽上传
    const uploadBox = document.getElementById('upload-box');
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    uploadBox.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => { if (fileInput.files.length) fileInfo.textContent = `已选择文件：${fileInput.files[0].name}`; });
    uploadBox.addEventListener('dragover', e => { e.preventDefault(); uploadBox.classList.add('dragover'); });
    uploadBox.addEventListener('dragleave', () => uploadBox.classList.remove('dragover'));
    uploadBox.addEventListener('drop', e => {
        e.preventDefault();
        uploadBox.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            fileInfo.textContent = `已选择文件：${e.dataTransfer.files[0].name}`;
        }
    });

    // 通用模态框
    const modal = document.getElementById('modal');
    window.showModal = (title, message) => {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-message').innerHTML = message;
        modal.style.display = 'flex';
    };
    window.closeModal = () => { modal.style.display = 'none'; };

    // 欢迎弹窗
    const welcomeModal = document.getElementById('welcome-modal');
    window.showWelcomeModal = () => { if (welcomeModal) welcomeModal.style.display = 'flex'; };
    window.closeWelcomeModal = () => { if (welcomeModal) welcomeModal.style.display = 'none'; };
    if (welcomeModal) {
        welcomeModal.addEventListener('click', function(e) {
            if (e.target === welcomeModal) closeWelcomeModal();
        });
    }

    // 邮件详情弹窗遮罩关闭
    const mailModalEl = document.getElementById('mail-modal');
    if (mailModalEl) {
        mailModalEl.addEventListener('click', function(e) {
            if (e.target === mailModalEl) {
                closeMailModal();
            }
        });
    }

    // ESC 关闭顺序
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' || e.keyCode === 27) {
            if (welcomeModal && welcomeModal.style.display === 'flex') { closeWelcomeModal(); return; }
            if (mailModalEl && mailModalEl.style.display === 'flex') { closeMailModal(); return; }
            const pasteModal = document.getElementById('paste-modal');
            if (pasteModal && pasteModal.style.display === 'flex') { closePasteModal(); return; }
            if (modal && modal.style.display === 'flex') { closeModal(); return; }
        }
    });

    window.setPassword = () => { localStorage.setItem('password', document.getElementById('password').value.trim()); };

    // 搜索
    const searchInput = document.getElementById('searchEmailInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    searchInput.addEventListener('input', (e) => {
        currentSearchKeyword = e.target.value;
        clearBtn.style.display = currentSearchKeyword ? 'flex' : 'none';
        applySearchAndRender();
    });
    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentSearchKeyword = '';
        clearBtn.style.display = 'none';
        applySearchAndRender();
    });

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[m])
                  .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, c => c);
    }

    window.onload = () => {
        reloadAllData();
        showWelcomeModal();
    };
})();
