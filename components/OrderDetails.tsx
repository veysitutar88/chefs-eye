
import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, CategorizedItems, AppLanguage } from '../types';
import { X, Calendar, Image as ImageIcon, CheckCircle, Clock, Utensils, Wine, Bell, Edit2, Save, Trash2, Plus, RotateCcw, Ban, Printer } from 'lucide-react';

interface OrderDetailsProps {
  order: Order;
  onClose: () => void;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onUpdateOrder: (updatedOrder: Order) => void;
  appLang: AppLanguage;
  onPrint: (order: Order) => void;
  onDelete: (id: string) => void;
}

export const OrderDetails: React.FC<OrderDetailsProps> = ({ order, onClose, onUpdateStatus, onUpdateOrder, appLang, onPrint, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedOrder, setEditedOrder] = useState<Order>(order);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const TEXT_MAP = {
    DE: {
      cancelConfirm: "Möchten Sie diese Bestellung wirklich stornieren?",
      deleteConfirm: "Diese Bestellung wird dauerhaft gelöscht. Fortfahren?",
      deleteBtn: "Dauerhaft löschen",
      deleteCancel: "Abbrechen",
      deleteTitle: "Bestellung löschen",
      empty: "Leere Liste",
      add: "Neuen Artikel hinzufügen...",
      notes: "Notizen",
      ocr: "Originaltext (OCR)",
      source: "Originalquelle",
      copied: "Kopiert!",
      dishes: "Gerichte / Essen",
      drinks: "Getränke",
      service: "Service / Wichtig",
      status: {
        new: "NEU",
        work: "ARBEIT",
        done: "FERTIG",
        cancel: "STORNO"
      },
      pax: "Gäste",
      menu: "Menütyp",
      print: "Drucken"
    },
    RU: {
      cancelConfirm: "Вы действительно хотите отменить этот заказ?",
      deleteConfirm: "Заказ будет удалён навсегда. Продолжить?",
      deleteBtn: "Удалить навсегда",
      deleteCancel: "Отмена",
      deleteTitle: "Удалить заказ",
      empty: "Пустой список",
      add: "Добавить позицию...",
      notes: "Заметки",
      ocr: "Оригинальный текст (OCR)",
      source: "Источник",
      copied: "Скопировано!",
      dishes: "Блюда / Еда",
      drinks: "Напитки",
      service: "Сервис / Важно",
      status: {
        new: "НОВЫЙ",
        work: "В РАБОТЕ",
        done: "ГОТОВО",
        cancel: "ОТМЕНА"
      },
      pax: "Гости",
      menu: "Тип меню",
      print: "Печать"
    },
    EN: {
      cancelConfirm: "Are you sure you want to cancel this order?",
      deleteConfirm: "This order will be permanently deleted. Continue?",
      deleteBtn: "Delete permanently",
      deleteCancel: "Cancel",
      deleteTitle: "Delete order",
      empty: "Empty list",
      add: "Add new item...",
      notes: "Notes",
      ocr: "Original Text (OCR)",
      source: "Original Source",
      copied: "Copied!",
      dishes: "Dishes / Food",
      drinks: "Drinks",
      service: "Service / Important",
      status: {
        new: "NEW",
        work: "WORK",
        done: "DONE",
        cancel: "CANCEL"
      },
      pax: "Guests",
      menu: "Menu Type",
      print: "Print"
    }
  };
  const t = TEXT_MAP[appLang as keyof typeof TEXT_MAP] ?? TEXT_MAP.DE;

  const [newItemInputs, setNewItemInputs] = useState({
    dishes: '',
    drinks: '',
    service: ''
  });

  useEffect(() => {
    setEditedOrder(order);
  }, [order]);

  const handleSave = () => {
    onUpdateOrder(editedOrder);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedOrder(order);
    setIsEditing(false);
  };

  const handleCancelOrder = () => {
    if (window.confirm(t.cancelConfirm)) {
      onUpdateStatus(order.id, 'CANCELLED');
    }
  };

  const handlePrint = () => {
    // Use editedOrder to ensure we print what the user currently sees/has edited
    onPrint(editedOrder);
  };

  const updateField = (field: keyof Order, value: any) => {
    setEditedOrder(prev => ({ ...prev, [field]: value }));
  };

  const addItem = (category: keyof CategorizedItems) => {
    const value = newItemInputs[category].trim();
    if (!value) return;

    setEditedOrder(prev => ({
      ...prev,
      items: {
        ...prev.items,
        [category]: [...prev.items[category], value]
      }
    }));
    
    setNewItemInputs(prev => ({ ...prev, [category]: '' }));
  };

  const removeItem = (category: keyof CategorizedItems, index: number) => {
    setEditedOrder(prev => ({
      ...prev,
      items: {
        ...prev.items,
        [category]: prev.items[category].filter((_, i) => i !== index)
      }
    }));
  };

  const renderEditableList = (category: keyof CategorizedItems, icon: React.ReactNode, title: string, colorClass: string) => (
    <div className={`border rounded-xl overflow-hidden transition-all ${isEditing ? 'bg-white dark:bg-slate-900 border-orange-200 dark:border-orange-500/50 ring-4 ring-orange-50 dark:ring-orange-500/10' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'}`}>
      <div className={`${isEditing ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-slate-100 dark:bg-slate-800/80'} px-4 py-3 border-b ${isEditing ? 'border-orange-100 dark:border-orange-900/30' : 'border-slate-200 dark:border-slate-800'}`}>
        <h3 className={`font-bold flex items-center ${isEditing ? 'text-orange-800 dark:text-orange-300' : 'text-slate-700 dark:text-slate-200'}`}>
          {icon}
          <span className="ml-2">{title}</span>
        </h3>
      </div>
      <div className="p-4">
        {editedOrder.items[category].length > 0 ? (
          <ul className="space-y-3">
            {editedOrder.items[category].map((item, i) => (
              <li key={i} className="flex items-center justify-between text-slate-800 dark:text-slate-200 group">
                <div className="flex items-center flex-1">
                  {!isEditing && <div className={`w-1.5 h-1.5 rounded-full mr-3 ${colorClass}`}></div>}
                  {isEditing ? (
                    <input 
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-orange-400 dark:focus:border-orange-600"
                      value={item}
                      onChange={(e) => {
                        const newItems = [...editedOrder.items[category]];
                        newItems[i] = e.target.value;
                        setEditedOrder(prev => ({
                          ...prev,
                          items: { ...prev.items, [category]: newItems }
                        }));
                      }}
                    />
                  ) : (
                    <span className="text-lg">{item}</span>
                  )}
                </div>
                {isEditing && (
                  <button 
                    onClick={() => removeItem(category, i)}
                    className="ml-2 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-400 dark:text-slate-600 italic text-sm">{t.empty}</p>
        )}
        
        {isEditing && (
          <div className="mt-4 flex items-center space-x-2">
            <input 
              type="text"
              placeholder={t.add}
              className="flex-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={newItemInputs[category]}
              onChange={(e) => setNewItemInputs(prev => ({ ...prev, [category]: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && addItem(category)}
            />
            <button 
              onClick={() => addItem(category)}
              className="p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end transition-opacity print:static print:bg-white print:backdrop-blur-none print:z-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl overflow-y-auto animate-slide-in-right flex flex-col transition-colors print:max-w-full print:shadow-none print:animate-none print:overflow-visible">
        
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start sticky top-0 bg-white dark:bg-slate-900 z-20 shadow-sm transition-colors">
          <div className="flex-1">
            <div className="flex items-center justify-between mr-8">
               {isEditing ? (
                 <input 
                   className="text-2xl font-bold text-slate-900 dark:text-white border-b-2 border-orange-500 focus:outline-none bg-transparent w-full"
                   value={editedOrder.clientName}
                   onChange={(e) => updateField('clientName', e.target.value)}
                 />
               ) : (
                 <div className="flex items-center space-x-2">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{order.clientName}</h2>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold border border-slate-200 dark:border-slate-700">
                        {order.language}
                    </span>
                 </div>
               )}
            </div>
            
            <div className="flex flex-wrap items-center gap-4 mt-3 text-slate-500 dark:text-slate-400 text-sm">
              <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded transition-colors">
                <Calendar size={14} className="text-slate-400 dark:text-slate-500" />
                {isEditing ? (
                   <input 
                    type="datetime-local"
                    className="bg-transparent focus:outline-none text-slate-800 dark:text-slate-100 font-medium"
                    value={editedOrder.deliveryDateTime ? new Date(editedOrder.deliveryDateTime).toISOString().slice(0, 16) : ''}
                    onChange={(e) => updateField('deliveryDateTime', new Date(e.target.value).toISOString())}
                   />
                ) : (
                  <span>{new Date(order.deliveryDateTime).toLocaleString(appLang === 'RU' ? 'ru-RU' : 'de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' })}</span>
                )}
              </div>

              <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded transition-colors">
                 <span className="font-semibold text-slate-700 dark:text-slate-300">{t.pax}:</span>
                 {isEditing ? (
                   <input 
                     type="number"
                     className="w-16 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1 py-0.5 text-center focus:outline-none focus:border-orange-500"
                     value={editedOrder.guestsCount}
                     onChange={(e) => updateField('guestsCount', parseInt(e.target.value) || 0)}
                   />
                 ) : (
                   <span className="font-semibold text-slate-900 dark:text-slate-100">{order.guestsCount}</span>
                 )}
              </div>

              <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded transition-colors">
                {isEditing ? (
                  <input 
                    className="w-24 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1 py-0.5 text-sm focus:outline-none focus:border-orange-500"
                    placeholder={t.menu}
                    value={editedOrder.menuType}
                    onChange={(e) => updateField('menuType', e.target.value)}
                  />
                ) : (
                  <span className="px-1 text-slate-600 dark:text-slate-400">{order.menuType}</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400 transition-colors print:hidden"
                  title={t.deleteTitle}
                >
                  <Trash2 size={20} />
                </button>
                <button
                  onClick={handlePrint}
                  className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors print:hidden"
                  title={t.print}
                >
                  <Printer size={20} />
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-orange-400 transition-colors print:hidden"
                  title="Edit"
                >
                  <Edit2 size={20} />
                </button>
              </>
            )}
            
            {isEditing && (
               <>
                 <button 
                    onClick={handleCancelEdit}
                    className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="Cancel"
                 >
                   <RotateCcw size={20} />
                 </button>
                 <button 
                    onClick={handleSave}
                    className="p-2 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors shadow-md"
                    title="Save"
                 >
                   <Save size={20} />
                 </button>
               </>
            )}
            <button 
              onClick={onClose}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 rounded-full text-slate-400 dark:text-slate-500 transition-colors ml-2 print:hidden"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8 flex-1 pb-24 md:pb-6">
          {!isEditing && (
            <div className="grid grid-cols-4 gap-2 print:hidden">
              <button 
                onClick={() => onUpdateStatus(order.id, 'NEW')}
                className={`py-3 rounded-xl text-[10px] md:text-xs font-bold border transition-all
                  ${order.status === 'NEW' ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-200' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}
                `}
              >
                {t.status.new}
              </button>
              <button 
                onClick={() => onUpdateStatus(order.id, 'IN_PROGRESS')}
                className={`py-3 rounded-xl text-[10px] md:text-xs font-bold border transition-all flex items-center justify-center space-x-1
                  ${order.status === 'IN_PROGRESS' ? 'bg-orange-500 text-white shadow-md ring-2 ring-orange-200' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}
                `}
              >
                <Clock size={14} className="hidden xs:inline" />
                <span>{t.status.work}</span>
              </button>
              <button 
                onClick={() => onUpdateStatus(order.id, 'DONE')}
                className={`py-3 rounded-xl text-[10px] md:text-xs font-bold border transition-all flex items-center justify-center space-x-1
                  ${order.status === 'DONE' ? 'bg-green-600 text-white shadow-md ring-2 ring-green-200' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}
                `}
              >
                <CheckCircle size={14} className="hidden xs:inline" />
                <span>{t.status.done}</span>
              </button>
              <button 
                onClick={handleCancelOrder}
                className={`py-3 rounded-xl text-[10px] md:text-xs font-bold border transition-all flex items-center justify-center space-x-1
                  ${order.status === 'CANCELLED' ? 'bg-red-600 text-white shadow-md ring-2 ring-red-200' : 'border-slate-200 dark:border-slate-700 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10'}
                `}
              >
                <Ban size={14} className="hidden xs:inline" />
                <span>{t.status.cancel}</span>
              </button>
            </div>
          )}

          <div className="grid gap-6">
            {renderEditableList(
              'service', 
              <Bell size={16} className={`mr-2 ${isEditing ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500'}`} />, 
              t.service, 
              'bg-red-500'
            )}

            {renderEditableList(
              'dishes', 
              <Utensils size={18} className={`mr-2 ${isEditing ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500'}`} />, 
              t.dishes, 
              'bg-slate-400 dark:bg-slate-600'
            )}

            {renderEditableList(
              'drinks', 
              <Wine size={18} className={`mr-2 ${isEditing ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500'}`} />, 
              t.drinks, 
              'bg-slate-300 dark:bg-slate-700'
            )}
          </div>

          <div className={`bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border space-y-4 transition-colors ${isEditing ? 'border-orange-200 dark:border-orange-900/50 ring-2 ring-orange-50 dark:ring-orange-900/10' : 'border-slate-200 dark:border-slate-800'}`}>
             <div>
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">{t.notes}</h4>
                {isEditing ? (
                  <textarea 
                    className="w-full h-24 p-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded focus:outline-none focus:border-orange-500"
                    value={editedOrder.notes || ''}
                    onChange={(e) => updateField('notes', e.target.value)}
                    placeholder={t.add}
                  />
                ) : (
                   order.notes ? <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{order.notes}</p> : <p className="text-sm text-slate-400 dark:text-slate-600 italic">---</p>
                )}
             </div>
             
             {!isEditing && (
               <div>
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">{t.ocr}</h4>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800/60 p-2 rounded border border-slate-200 dark:border-slate-700 max-h-32 overflow-y-auto transition-colors">
                      {order.transcription}
                  </p>
               </div>
             )}
          </div>

          {!isEditing && (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-6 transition-colors">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center space-x-2 mb-4">
                <ImageIcon size={18} className="text-slate-400 dark:text-slate-500" />
                <span>{t.source}</span>
              </h3>
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 transition-colors">
                {order.originalImage ? (
                  <img 
                    src={order.originalImage.startsWith('data:') ? order.originalImage : `data:image/jpeg;base64,${order.originalImage}`} 
                    alt="Source" 
                    className="w-full object-contain max-h-64"
                  />
                ) : (
                  <div className="h-40 flex items-center justify-center text-slate-400 dark:text-slate-600">---</div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {showCopiedToast && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-800 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-full shadow-lg text-sm flex items-center space-x-2 animate-fade-in-up z-50">
            <CheckCircle size={16} className="text-green-400 dark:text-green-600" />
            <span>{t.copied}</span>
          </div>
        )}

        {/* Delete confirmation dialog */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-full">
                  <Trash2 size={20} className="text-red-600 dark:text-red-400" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">{t.deleteTitle}</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">{t.deleteConfirm}</p>
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  {t.deleteCancel}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); onDelete(order.id); }}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-red-600 text-white hover:bg-red-700 transition-colors shadow-md"
                >
                  {t.deleteBtn}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
