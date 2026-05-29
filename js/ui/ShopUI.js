/**
 * ShopUI.js — Renders buyable store inventories, pricing listings and validations
 */

import { SCREENS } from '../utils/constants.js';
import { gameState } from '../core/GameState.js';
import { NPC_DATA } from '../data/npcs.js';
import { ITEM_DATA } from '../data/items.js';

export class ShopUI {
  constructor() {
    this.merchantNpcId = null;
  }

  /**
   * Set merchant npc reference
   * @param {string} npcId
   */
  setMerchant(npcId) {
    this.merchantNpcId = npcId;
  }

  /**
   * Render Store Transaction screen layout
   * @param {HTMLElement} container
   */
  render(container) {
    const player = gameState.getPlayer();
    const npc = NPC_DATA[this.merchantNpcId];
    if (!player || !npc) return;

    // Build buy item nodes list
    let buyListHtml = '';
    if (npc.shopInventory && npc.shopInventory.length > 0) {
      npc.shopInventory.forEach(itemId => {
        const item = ITEM_DATA[itemId];
        if (item) {
          buyListHtml += `
            <div class="shop-item card" style="margin-bottom:10px">
              <span style="font-size:2rem">${item.icon}</span>
              <div style="flex:1">
                <h4 class="shop-item-name rarity-${item.rarity}">${item.name}</h4>
                <p class="shop-item-desc">${item.description}</p>
              </div>
              <div style="display:flex; flex-direction:column; align-items:flex-end; gap:5px">
                <span class="shop-item-price">💰 ${item.price} Oro</span>
                <button class="btn btn-primary btn-xs btn-buy" data-item-id="${item.id}" ${player.gold < item.price ? 'disabled' : ''}>Comprar</button>
              </div>
            </div>
          `;
        }
      });
    }

    // Build sell bag list
    let sellListHtml = '';
    const sellables = player.inventory.filter(i => !i.questItem);
    if (sellables.length > 0) {
      sellables.forEach(item => {
        const sellPrice = Math.max(1, Math.floor(item.price * 0.5));
        sellListHtml += `
          <div class="shop-item card" style="margin-bottom:10px">
            <span style="font-size:2rem">${item.icon}</span>
            <div style="flex:1">
              <h4 class="shop-item-name rarity-${item.rarity}">${item.name} (x${item.quantity})</h4>
              <p class="shop-item-desc">${item.description}</p>
            </div>
            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:5px">
              <span class="shop-item-price" style="color:var(--color-accent-blue)">💰 ${sellPrice} Oro</span>
              <button class="btn btn-danger btn-xs btn-sell" data-instance-id="${item.id}">Vender</button>
            </div>
          </div>
        `;
      });
    } else {
      sellListHtml = '<span class="text-xs text-muted">No tienes objetos de valor para vender.</span>';
    }

    container.innerHTML = `
      <div class="screen-shop">
        <header class="shop-header">
          <div class="shop-npc">${npc.icon}</div>
          <h2 class="heading-3 text-gold">${npc.name}</h2>
          <p class="text-secondary text-sm">Tu oro disponible: <span class="text-gold font-mono" style="font-weight:600">💰 ${player.gold} Oro</span></p>
        </header>

        <main class="shop-layout">
          <!-- LEFT SIDE: MERCHANDISE -->
          <div class="shop-panel">
            <h3 class="shop-panel-title">Comprar Mercancías</h3>
            <div>
              ${buyListHtml || '<span class="text-xs text-muted">Sin inventario disponible.</span>'}
            </div>
          </div>

          <!-- RIGHT SIDE: PLAYER BAG FOR SELLING -->
          <div class="shop-panel">
            <h3 class="shop-panel-title">Vender tus Objetos</h3>
            <div>
              ${sellListHtml}
            </div>
          </div>
        </main>

        <div style="max-width: var(--max-width-game); margin: 20px auto; width:100%">
          <button id="btn-shop-exit" class="btn btn-ghost btn-block">Terminar Transacción</button>
        </div>
      </div>
    `;
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    const btnExit = document.getElementById('btn-shop-exit');
    const buyBtns = document.querySelectorAll('.btn-buy');
    const sellBtns = document.querySelectorAll('.btn-sell');

    if (btnExit) {
      btnExit.addEventListener('click', () => {
        gameState.setScreen(SCREENS.GAME);
      });
    }

    // Purchase calls
    buyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const itemId = btn.getAttribute('data-item-id');
        window.gameEngine.services.shop.buyItem(itemId);
        this.render(document.getElementById('app'));
        this.bindEvents();
      });
    });

    // Sell calls
    sellBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const instId = btn.getAttribute('data-instance-id');
        window.gameEngine.services.shop.sellItem(instId);
        this.render(document.getElementById('app'));
        this.bindEvents();
      });
    });
  }
}
