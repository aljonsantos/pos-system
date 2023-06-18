/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    // Cordova is now initialized. Have fun!
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    document.getElementById('deviceready').classList.add('ready');
}

// localStorage.clear();

const drawerHandle = document.querySelector('.drawer__handle');
const drawer = document.querySelector(drawerHandle.dataset.targetDrawer);

drawerHandle.addEventListener('click', () => {
    drawer.toggleAttribute('open');
    drawerHandle.toggleAttribute('open');
});

const appMain = document.querySelector('.app__main');
const drawerMain = document.querySelector('.drawer__main');
let totalVal = parseFloat(document.querySelector('.info__total').innerHTML);

if (!localStorage.getItem('items')) {
    localStorage.setItem('items', '[]');
    localStorage.setItem('itemId', '0');
    localStorage.setItem('itemsLen', '0');
} else {
    loadItems();
}

function loadItems() {
    if(parseInt(localStorage.getItem('itemsLen')) > 0) {
        const items = JSON.parse(localStorage.getItem('items'));
        appMain.innerHTML = '';

        for (const item of Object.values(items)) {
            let element = makeItemElement(item);
            appMain.insertAdjacentHTML('beforeend', element);
        }

        itemsClickListener();
        itemsCheckboxClickListener(appMain.querySelectorAll('.item-checkbox'));
        itemsDelBtnClickListener(appMain.querySelectorAll('.item-del-btn'));
        persistSelectedItems();

    }
    else {
        appMain.innerHTML = noItemElement();
    }
    isEmptySelection();
}

function itemsClickListener() {
    for (const item of appMain.children) {
        item.addEventListener('click', (e) => {
            item.classList.add('item-touch-feedback');
            setTimeout(() => {
                item.classList.remove('item-touch-feedback');
            }, 500);

            if(!e.target.classList.contains('item-checkbox')) {
                revealItemDelBtn(e.target);
            }
        });
    }
}

function itemsCheckboxClickListener(checkboxes) {
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('click', () => {
            checkbox.classList.toggle('checked');
            if(checkbox.classList.contains('checked')) {
                addItemToDrawer(checkbox.dataset.item);
            } else {
                removeItemInDrawer(`#drawer-${checkbox.dataset.item.slice(1)}`);
            }
        })
    });
}

function itemsDelBtnClickListener(btns) {
    for (const btn of btns) {
        btn.addEventListener('click', () => {
            const itemDrawerId = `#drawer-${btn.dataset.item.slice(1)}`;
            if (drawerMain.querySelector(itemDrawerId)) {
                removeItemInDrawer(itemDrawerId);
            }

            const id = btn.dataset.item.slice(6);
            const items = JSON.parse(localStorage.getItem('items'));
            const idx = findItemIdx(id);
            items.splice(idx, 1);
            localStorage.setItem('itemsLen', `${parseInt(localStorage.getItem('itemsLen'))-1}`);
    
            if(parseInt(localStorage.getItem('itemsLen')) === 0) {
                localStorage.setItem('items', '[]');
                window.location.reload();
            }
            else {
                localStorage.setItem('items', JSON.stringify(items));
            }
            loadItems();
        });
    }
}

function revealItemDelBtn(item) {
    targetDelBtn = item.querySelector('.item-del-btn');
    if (appMain.querySelector('.item-del-btn.open')) {
        openDelBtn = appMain.querySelector('.item-del-btn.open');
        openDelBtn.classList.remove('open');
        appMain.querySelector(openDelBtn.dataset.item).classList.remove('shrink');
        if (openDelBtn === targetDelBtn) {
            return;
        }
    }

    if(targetDelBtn) {
        targetDelBtn.classList.add('open');
        appMain.querySelector(targetDelBtn.dataset.item).classList.add('shrink');
    }
}

function persistSelectedItems() {
    for (const selectedItem of drawerMain.children) {
        for (const item of appMain.children) {
            if(item.id === selectedItem.id.replace('drawer-', '')) {
                item.querySelector('.item-checkbox').classList.add('checked');
            }
        }
    }
}

function findItemIdx(id) {
    const items = JSON.parse(localStorage.getItem('items'))
    for (let i = 0; i < items.length; i++) {
        if(items[i].id === id) {
            return i;
        }
    }
}

function addItem(name, price) {
    const itemId = localStorage.getItem('itemId');
    const item = {id: itemId, name: name, price: price};
    let items = JSON.parse(localStorage.getItem('items'));
    if(parseInt(localStorage.getItem('itemsLen')) === 0) {
        items = [];
    }
    items.push(item);

    const addPanel = document.querySelector('.panel-add');
    addPanel.querySelector('#item-name').value = '';
    addPanel.querySelector('#item-price').value = '';
    
    localStorage.setItem('items', JSON.stringify(items));
    localStorage.setItem('itemsLen', `${parseInt(localStorage.getItem('itemsLen'))+1}`);
    localStorage.setItem('itemId', `${parseInt(itemId)+1}`);
    loadItems();
}

function addItemToDrawer(target) {
    const item = appMain.querySelector(target);
    const itemName = item.querySelector('.item-name').innerText;
    const itemPrc = item.querySelector('.item-price span').innerText;
    
    const element = makeDrawerItemElement(item.id, itemName, itemPrc);

    drawerMain.insertAdjacentHTML('beforeend', element);
    
    updateTotal(parseFloat(itemPrc), 'add');


    itemQuanBtnsListener();
    toggleDrawerActionBtns();
    isEmptySelection();
}

function removeItemInDrawer(target) {
    const item = drawerMain.querySelector(target);
    const itemPrc = parseFloat(item.querySelector('.item-price').dataset.price);
    const itemQuan = parseFloat(item.querySelector('.item-quan-val').innerText);
    
    updateTotal(itemPrc * itemQuan, 'sub');
    item.remove();
    
    itemQuanBtnsListener();
    toggleDrawerActionBtns();
    isEmptySelection();
}

let itemQuanBtns = drawerMain.querySelectorAll('.item-quan-btn');

function itemQuanBtnsListener() {
    itemQuanBtns = drawerMain.querySelectorAll('.item-quan-btn');
    itemQuanBtns.forEach(quan => {
        quan.onclick = () => {
            if(quan.dataset.op === 'add') {
                itemAddQuan(quan.dataset.item);
            }
            else {
                itemSubQuan(quan.dataset.item);
            }
        }
    });
}

function itemAddQuan(target) {
    const item = getDrawerItemInfo(drawerMain.querySelector(target));
    item.quan.innerText = item.quanVal + 1;
    item.price.querySelector('span').innerText = (item.quanVal+1) * item.prcVal;
    updateTotal(item.prcVal, 'add');
    toggleDrawerActionBtns();
}

function itemSubQuan(target) {
    const item = getDrawerItemInfo(drawerMain.querySelector(target));
    if (parseInt(item.quan.innerText) === 1) {
        removeItemInDrawer(target);
        const uncheckItem = appMain.querySelector(`#${target.replace('#drawer-', '')}`);
        appMain.querySelector(`#${uncheckItem.id}`).querySelector('.item-checkbox').classList.remove('checked');
    }
    else {
        item.quan.innerText = item.quanVal - 1;
        item.price.querySelector('span').innerText = (item.quanVal-1) * item.prcVal;
        updateTotal(item.prcVal, 'sub');
        toggleDrawerActionBtns();
    }
    isEmptySelection();
}

function getDrawerItemInfo(item) {
    const itemPrc = item.querySelector('.item-price');
    const itemQuan = item.querySelector('.item-quan-val');
    return { 
             price: itemPrc,
             quan: itemQuan,
             prcVal: parseFloat(itemPrc.dataset.price),
             quanVal: parseInt(itemQuan.innerText)
           };
}

function updateTotal(val, op) {
    switch(op) {
        case 'add':
            totalVal += val;
            break;
        case 'sub':
            totalVal -= val;
            break;
        default:
            totalVal = val;
    }
    document.querySelector('.info__total').innerText = totalVal;
}

const addBtn = document.querySelector('.btn-add');
const summaryBtn = document.querySelector('.drawer__actions .btn-done');

togglePanelListener(addBtn);
togglePanelListener(summaryBtn);

function togglePanelListener(toggleBtn) {
    toggleBtn.onclick = () => {
        const panel = document.querySelector(toggleBtn.dataset.targetPanel);
        const dimmer = document.querySelector('.panel-dim');
        panel.setAttribute('open', '');
        dimmer.classList.add('visible');
        
        panel.querySelector('.btn-close-panel').onclick = () => {
            document.querySelector(toggleBtn.dataset.targetPanel).removeAttribute('open');
            dimmer.classList.remove('visible');
            addBtn.classList.remove('focus');

        }

        if(toggleBtn === summaryBtn) {
            const finishBtn = panel.querySelector('.btn-finish');
            const amountInp = panel.querySelector('#amount');
            const changeInp = panel.querySelector('#change');
            
            panel.querySelector('#order-total').value = `₱ ${totalVal}`;
            amountInp.addEventListener('input', () => {
                let amountVal = parseFloat(amountInp.value);
                if (amountVal >= totalVal) {
                    changeInp.value = amountVal - totalVal;
                    finishBtn.removeAttribute('disabled');
                }
                else {
                    changeInp.value = 'Invalid Amount';
                    finishBtn.setAttribute('disabled', '');
                }
            });

            finishBtn.onclick = () => {
                document.querySelector(toggleBtn.dataset.targetPanel).removeAttribute('open');
                dimmer.classList.remove('visible');
                clear();
            }
        }

        if(toggleBtn === addBtn) {
            addBtn.classList.add('focus');
            const addItemBtn = panel.querySelector('.btn-add');
            const nameInp = panel.querySelector('#item-name');
            const priceInp = panel.querySelector('#item-price');

            validateItemInputs(nameInp, priceInp, addItemBtn);
            addItemBtn.onclick = () => {
                addItem(nameInp.value, priceInp.value);
                document.querySelector(toggleBtn.dataset.targetPanel).removeAttribute('open');
                dimmer.classList.remove('visible');
                addBtn.classList.remove('focus');
            }
        }
    }
}

function validateItemInputs(nameInp, priceInp, btn) {
    nameInp.addEventListener('input', () => {
        if(nameInp.value !== '' && parseFloat(priceInp.value) > 0) {
            btn.removeAttribute('disabled');
        }
        else {
            btn.setAttribute('disabled', '');
        }
    })
    priceInp.addEventListener('input', () => {
        if(parseFloat(priceInp.value) > 0 && nameInp.value !== '') {
            btn.removeAttribute('disabled');
        }
        else {
            btn.setAttribute('disabled', '');
        }
    })
}

const inputs = document.querySelectorAll('.input');

inputs.forEach(input => {
    input.querySelector('input').onfocus = () => {
        input.children[0].classList.add('focus');
    }
    input.querySelector('input').onblur = () => {
        input.children[0].classList.remove('focus');
    }
});

const clearBtn = document.querySelector('.drawer__actions .btn-clear');
clearBtn.onclick = clear;

function clear() {
    const checkboxes = appMain.querySelectorAll('.item-checkbox');
    for (const checkbox of checkboxes) {
        if(checkbox.classList.contains('checked')) {
            checkbox.classList.remove('checked');
            removeItemInDrawer('#drawer-' + checkbox.dataset.item.slice(1));
        }
    }
    document.querySelector('#amount').value = '';
    document.querySelector('#change').value = '';

}

function toggleDrawerActionBtns() {
    if(totalVal > 0) {
        clearBtn.removeAttribute('disabled');
        summaryBtn.removeAttribute('disabled');
    }
    else {
        clearBtn.setAttribute('disabled', '');
        summaryBtn.setAttribute('disabled', '');
    }
}

function isEmptySelection() {
    if(totalVal === 0) {
        drawerMain.innerHTML = noSelectedItemElement();
    }
    else {
        if(drawerMain.querySelector('.no-item')) {
            drawerMain.querySelector('.no-item').remove();
        }
    }
}

function makeItemElement(item) {
    return `<div class="main__item item flex" id="item-${item.id}">
                <div class="item-name">${item.name}</div>
                <div class="flex align-center">
                    <div class="item-price">₱ <span>${item.price}</span></div>
                    <button class="btn item-checkbox" data-item="#item-${item.id}"></button>
                </div>
                <button class="btn item-del-btn" data-item="#item-${item.id}"></button>
            </div>`;
}

function makeDrawerItemElement(id, name, price) {
    return `<div class="main__item item flex" id="drawer-${id}">
                <div class="item-name">${name}</div>
                <div class="flex align-center gap-1">
                    <div class="item-price" data-price="${price}">₱ <span>${price}</span></div>
                    <div class="item-quantity flex align-center">
                        <button class="item-quan-btn btn" data-op="sub" data-item="#drawer-${id}"></button>
                        <div class="item-quan-val">1</div>
                        <button class="item-quan-btn btn" data-op="add" data-item="#drawer-${id}"></button>
                    </div>
                </div>
            </div>`;
}

function noItemElement() {
    return `<div class="no-item">
                <div class="no-item__msg">
                    Empty Item List
                </div>
            </div>`;
}

function noSelectedItemElement() {
    return `<div class="no-item">
                <div class="no-item__msg">
                    No Item Selected
                </div>
            </div>`;
}