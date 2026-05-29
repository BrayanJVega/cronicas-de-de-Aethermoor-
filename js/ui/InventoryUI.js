/**
 * InventoryUI.js — Renders full bag storage grid and active equipment slots with equip/consume buttons
 */

import { SCREENS, ITEM_TYPE, EQUIP_SLOTS } from '../utils/constants.js';
import { gameState } from '../core/GameState.js';

export class InventoryUI {
  constructor() {
    this.selectedItemInstanceId = null;
  }

  /**
   * Render inventory layout
   * @param {HTMLElement} container
   */
  render(container) {
    const player = gameState.getPlayer();
    if (!player) return;

    // Build equipment summary html
    let equipHtml = '';
    const slots = [
      { id: EQUIP_SLOTS.WEAPON, name: 'Arma', icon: '⚔️' },
      { id: EQUIP_SLOTS.ARMOR, name: 'Pechera', icon: '🛡️' },
      { id: EQUIP_SLOTS.HELMET, name: 'Casco', icon: '🪖' },
      { id: EQUIP_SLOTS.SHIELD, name: 'Escudo', icon: '🛡️' },
      { id: EQUIP_SLOTS.ACCESSORY, name: 'Accesorio', icon: '💍' },
    ];

    slots.forEach(slot => {
      const eq = player.equipment[slot.id];
      equipHtml += `
        <div class="card" style="display:flex; align-items:center; gap:10px; padding: 10px; margin-bottom:8px">
          <div style="font-size:1.5rem">${eq ? eq.icon : slot.icon}</div>
          <div style="flex:1">
            <div class="text-xs text-muted">${slot.name}</div>
            <div class="text-sm font-weight-medium ${eq ? 'text-gold' : ''}">${eq ? eq.name : 'Vacio'}</div>
          </div>
          ${eq ? `<button class="btn btn-ghost btn-xs btn-unequip" data-slot="${slot.id}">Desequipar</button>` : ''}
        </div>
      `;
    });

    // Build bags inventory grid storage
    let gridHtml = '';
    for (let i = 0; i < player.maxInventorySlots; i++) {
      const item = player.inventory[i];
      const isSelected = item && this.selectedItemInstanceId === item.id;
      gridHtml += `
        <div class="inventory-slot ${isSelected ? 'equipped' : ''}" data-index="${i}" data-id="${item ? item.id : ''}">
          ${item ? `
            <span>${item.icon}</span>
            ${item.quantity > 1 ? `<span class="item-count">${item.quantity}</span>` : ''}
          ` : ''}
        </div>
      `;
    }

    // Build details card for selected item
    let detailsHtml = '<span class="text-xs text-muted">Selecciona un objeto para ver sus detalles.</span>';
    const selectedItem = player.inventory.find(i => i.id === this.selectedItemInstanceId);

    if (selectedItem) {
      let statsHtml = '';
      if (selectedItem.stats) {
        for (const stat in selectedItem.stats) {
          statsHtml += `<div><span class="text-muted">${stat.toUpperCase()}:</span> <span class="text-gold">+${selectedItem.stats[stat]}</span></div>`;
        }
      }

      const isEquippable = selectedItem.type !== ITEM_TYPE.POTION && selectedItem.type !== ITEM_TYPE.MATERIAL;
      const isPotion = selectedItem.type === ITEM_TYPE.POTION;

      detailsHtml = `
        <div style="display:flex; flex-direction:column; gap:12px">
          <div style="display:flex; align-items:center; gap:10px">
            <span style="font-size:2.5rem">${selectedItem.icon}</span>
            <div>
              <h4 class="text-gold" style="font-size:1.1rem">${selectedItem.name}</h4>
              <span class="text-xs rarity-${selectedItem.rarity}" style="text-transform:uppercase">${selectedItem.rarity}</span>
            </div>
          </div>
          <p class="text-sm text-secondary" style="font-style:italic">"${selectedItem.description}"</p>
          
          ${statsHtml ? `<div class="card text-xs" style="padding:10px">${statsHtml}</div>` : ''}

          <div style="display:flex; gap:10px; margin-top:10px">
            ${isEquippable ? `<button id="btn-inventory-equip" class="btn btn-primary btn-block">Equipar</button>` : ''}
            ${isPotion ? `<button id="btn-inventory-use" class="btn btn-secondary btn-block">Consumir</button>` : ''}
            <button id="btn-inventory-sell" class="btn btn-danger btn-block">Vender (x${Math.max(1, Math.floor(selectedItem.price * 0.5))} Oro)</button>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="screen-shop">
        <header class="shop-header">
          <h2 class="heading-3 text-gold">🎒 Mochila de Aventurero</h2>
          <p class="text-secondary text-sm">Gestiona tu inventario, equipamiento y recursos</p>
        </header>

        <main class="shop-layout">
          <!-- LEFT SIDE: BAG GRID AND SLOTS -->
          <div class="shop-panel">
            <h3 class="shop-panel-title">Objetos Transportados (${player.inventory.length}/${player.maxInventorySlots})</h3>
            <div class="inventory-grid">
              ${gridHtml}
            </div>

            <h3 class="shop-panel-title" style="margin-top:30px">Equipo Activo</h3>
            <div>
              ${equipHtml}
            </div>
          </div>

          <!-- RIGHT SIDE: DETAILS -->
          <div class="shop-panel">
            <h3 class="shop-panel-title">Detalles del Objeto</h3>
            <div class="card" style="padding:20px">
              ${detailsHtml}
            </div>

            <button id="btn-inventory-back" class="btn btn-ghost btn-block" style="margin-top:30px">Volver al Mapa</button>
          </div>
        </main>
      </div>
    `;
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    const btnBack = document.getElementById('btn-inventory-back');
    const slots = document.querySelectorAll('.inventory-slot');
    const btnEquip = document.getElementById('btn-inventory-equip');
    const btnUse = document.getElementById('btn-inventory-use');
    const btnSell = document.getElementById('btn-inventory-sell');

    if (btnBack) {
      btnBack.addEventListener('click', () => {
        gameState.setScreen(SCREENS.GAME);
      });
    }

    // Select inventory slots clicks
    slots.forEach(slot => {
      slot.addEventListener('click', () => {
        const instId = slot.getAttribute('data-id');
        if (instId) {
          this.selectedItemInstanceId = instId;
        } else {
          this.selectedItemInstanceId = null;
        }
        this.render(document.getElementById('app'));
        this.bindEvents();
      });
    });

    // Equip Click
    if (btnEquip) {
      btnEquip.addEventListener('click', () => {
        if (this.selectedItemInstanceId) {
          window.gameEngine.services.inventory.equipItem(this.selectedItemInstanceId);
          this.selectedItemInstanceId = null;
          this.render(document.getElementById('app'));
          this.bindEvents();
        }
      });
    }

    // Use consumable potion click
    if (btnUse) {
      btnUse.addEventListener('click', () => {
        if (this.selectedItemInstanceId) {
          window.gameEngine.services.inventory.usePotion(this.selectedItemInstanceId);
          this.selectedItemInstanceId = null;
          this.render(document.getElementById('app'));
          this.bindEvents();
        }
      });
    }

    // Sell back click
    if (btnSell) {
      btnSell.addEventListener('click', () => {
        if (this.selectedItemInstanceId) {
          window.gameEngine.services.shop.sellItem(this.selectedItemInstanceId);
          this.selectedItemInstanceId = null;
          this.render(document.getElementById('app'));
          this.bindEvents();
        }
      });
    }

    // Unequip item slot clicks
    const unequipBtns = document.querySelectorAll('.btn-unequip');
    unequipBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const slot = btn.getAttribute('data-slot');
        window.gameEngine.services.inventory.unequipItem(slot);
        this.render(document.getElementById('app'));
        this.bindEvents();
      });
    });
  }
}
