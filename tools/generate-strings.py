#!/usr/bin/env python3
"""
Nebula Strike Localization Generator
Creates translated strings for all UI elements in 12 languages
"""

import os
import json


class LocalizationGenerator:
    def __init__(self, output_dir="shared-assets/raw/data/strings"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        
        # Language definitions with native names
        self.languages = {
            "en": {"name": "English", "native": "English", "rtl": False},
            "es": {"name": "Spanish", "native": "Español", "rtl": False},
            "fr": {"name": "French", "native": "Français", "rtl": False},
            "de": {"name": "German", "native": "Deutsch", "rtl": False},
            "it": {"name": "Italian", "native": "Italiano", "rtl": False},
            "pt": {"name": "Portuguese", "native": "Português", "rtl": False},
            "ru": {"name": "Russian", "native": "Русский", "rtl": False},
            "ja": {"name": "Japanese", "native": "日本語", "rtl": False},
            "ko": {"name": "Korean", "native": "한국어", "rtl": False},
            "zh": {"name": "Chinese", "native": "简体中文", "rtl": False},
            "ar": {"name": "Arabic", "native": "العربية", "rtl": True},
            "hi": {"name": "Hindi", "native": "हिन्दी", "rtl": False},
        }
        
        # Professional translations (not just placeholders)
        self.translations = {
            # Core UI
            "app_name": {
                "en": "Nebula Strike",
                "es": "Ataque de Nebulosa",
                "fr": "Frappe Nébuleuse",
                "de": "Nebel-Streich",
                "it": "Colpo Nebulosa",
                "pt": "Golpe da Nebulosa",
                "ru": "Удар Туманности",
                "ja": "ネビュラストライク",
                "ko": "성운 공격",
                "zh": "星云打击",
                "ar": "ضربة السديم",
                "hi": "नेब्युला स्ट्राइक"
            },
            
            # Main Menu
            "play": {
                "en": "PLAY",
                "es": "JUGAR",
                "fr": "JOUER",
                "de": "SPIELEN",
                "it": "GIOCA",
                "pt": "JOGAR",
                "ru": "ИГРАТЬ",
                "ja": "プレイ",
                "ko": "플레이",
                "zh": "开始游戏",
                "ar": "العب",
                "hi": "खेलें"
            },
            "continue": {
                "en": "CONTINUE",
                "es": "CONTINUAR",
                "fr": "CONTINUER",
                "de": "FORTSETZEN",
                "it": "CONTINUA",
                "pt": "CONTINUAR",
                "ru": "ПРОДОЛЖИТЬ",
                "ja": "続ける",
                "ko": "계속하기",
                "zh": "继续",
                "ar": "استمر",
                "hi": "जारी रखें"
            },
            "shop": {
                "en": "SHOP",
                "es": "TIENDA",
                "fr": "BOUTIQUE",
                "de": "LADEN",
                "it": "NEGOZIO",
                "pt": "LOJA",
                "ru": "МАГАЗИН",
                "ja": "ショップ",
                "ko": "상점",
                "zh": "商店",
                "ar": "المتجر",
                "hi": "दुकान"
            },
            "settings": {
                "en": "SETTINGS",
                "es": "AJUSTES",
                "fr": "PARAMÈTRES",
                "de": "EINSTELLUNGEN",
                "it": "IMPOSTAZIONI",
                "pt": "CONFIGURAÇÕES",
                "ru": "НАСТРОЙКИ",
                "ja": "設定",
                "ko": "설정",
                "zh": "设置",
                "ar": "الإعدادات",
                "hi": "सेटिंग्स"
            },
            "leaderboard": {
                "en": "LEADERBOARD",
                "es": "CLASIFICACIÓN",
                "fr": "CLASSEMENT",
                "de": "BESTENLISTE",
                "it": "CLASSIFICA",
                "pt": "PLACAR",
                "ru": "ТАБЛИЦА ЛИДЕРОВ",
                "ja": "ランキング",
                "ko": "리더보드",
                "zh": "排行榜",
                "ar": "لوحة المتصدرين",
                "hi": "लीडरबोर्ड"
            },
            "achievements": {
                "en": "ACHIEVEMENTS",
                "es": "LOGROS",
                "fr": "SUCCÈS",
                "de": "ERFOLGE",
                "it": "OBIETTIVI",
                "pt": "CONQUISTAS",
                "ru": "ДОСТИЖЕНИЯ",
                "ja": "実績",
                "ko": "업적",
                "zh": "成就",
                "ar": "الإنجازات",
                "hi": "उपलब्धियां"
            },
            
            # Game States
            "game_over": {
                "en": "GAME OVER",
                "es": "JUEGO TERMINADO",
                "fr": "PARTIE TERMINÉE",
                "de": "SPIEL VORBEI",
                "it": "GAME OVER",
                "pt": "FIM DE JOGO",
                "ru": "ИГРА ОКОНЧЕНА",
                "ja": "ゲームオーバー",
                "ko": "게임 오버",
                "zh": "游戏结束",
                "ar": "انتهت اللعبة",
                "hi": "खेल खत्म"
            },
            "victory": {
                "en": "VICTORY!",
                "es": "¡VICTORIA!",
                "fr": "VICTOIRE !",
                "de": "SIEG!",
                "it": "VITTORIA!",
                "pt": "VITÓRIA!",
                "ru": "ПОБЕДА!",
                "ja": "勝利！",
                "ko": "승리!",
                "zh": "胜利！",
                "ar": "انتصار!",
                "hi": "जीत!"
            },
            "paused": {
                "en": "PAUSED",
                "es": "PAUSADO",
                "fr": "PAUSE",
                "de": "PAUSIERT",
                "it": "PAUSA",
                "pt": "PAUSADO",
                "ru": "ПАУЗА",
                "ja": "一時停止",
                "ko": "일시정지",
                "zh": "暂停",
                "ar": "متوقف مؤقتاً",
                "hi": "रोका गया"
            },
            "level_complete": {
                "en": "LEVEL COMPLETE!",
                "es": "¡NIVEL COMPLETADO!",
                "fr": "NIVEAU TERMINÉ !",
                "de": "LEVEL GESCHAFFT!",
                "it": "LIVELLO COMPLETATO!",
                "pt": "NÍVEL COMPLETO!",
                "ru": "УРОВЕНЬ ПРОЙДЕН!",
                "ja": "レベルクリア！",
                "ko": "레벨 완료!",
                "zh": "关卡完成！",
                "ar": "اكتمل المستوى!",
                "hi": "स्तर पूरा!"
            },
            
            # HUD Elements
            "score": {
                "en": "Score",
                "es": "Puntuación",
                "fr": "Score",
                "de": "Punkte",
                "it": "Punteggio",
                "pt": "Pontuação",
                "ru": "Счёт",
                "ja": "スコア",
                "ko": "점수",
                "zh": "分数",
                "ar": "النقاط",
                "hi": "स्कोर"
            },
            "high_score": {
                "en": "High Score",
                "es": "Mejor Puntuación",
                "fr": "Meilleur Score",
                "de": "Highscore",
                "it": "Record",
                "pt": "Pontuação Máxima",
                "ru": "Рекорд",
                "ja": "ハイスコア",
                "ko": "최고 점수",
                "zh": "最高分",
                "ar": "أعلى نقاط",
                "hi": "उच्च स्कोर"
            },
            "coins": {
                "en": "Coins",
                "es": "Monedas",
                "fr": "Pièces",
                "de": "Münzen",
                "it": "Monete",
                "pt": "Moedas",
                "ru": "Монеты",
                "ja": "コイン",
                "ko": "코인",
                "zh": "金币",
                "ar": "العملات",
                "hi": "सिक्के"
            },
            "level": {
                "en": "Level",
                "es": "Nivel",
                "fr": "Niveau",
                "de": "Level",
                "it": "Livello",
                "pt": "Nível",
                "ru": "Уровень",
                "ja": "レベル",
                "ko": "레벨",
                "zh": "关卡",
                "ar": "المستوى",
                "hi": "स्तर"
            },
            "lives": {
                "en": "Lives",
                "es": "Vidas",
                "fr": "Vies",
                "de": "Leben",
                "it": "Vite",
                "pt": "Vidas",
                "ru": "Жизни",
                "ja": "残機",
                "ko": "목숨",
                "zh": "生命",
                "ar": "الحياات",
                "hi": "जीवन"
            },
            
            # Power-ups
            "shield": {
                "en": "Shield",
                "es": "Escudo",
                "fr": "Bouclier",
                "de": "Schild",
                "it": "Scudo",
                "pt": "Escudo",
                "ru": "Щит",
                "ja": "シールド",
                "ko": "실드",
                "zh": "护盾",
                "ar": "الدرع",
                "hi": "ढाल"
            },
            "laser": {
                "en": "Laser Boost",
                "es": "Potenciador Láser",
                "fr": "Boost Laser",
                "de": "Laser-Boost",
                "it": "Potenziamento Laser",
                "pt": "Impulso Laser",
                "ru": "Усиление Лазера",
                "ja": "レーザーブースト",
                "ko": "레이저 부스트",
                "zh": "激光强化",
                "ar": "تعزيز الليزر",
                "hi": "लेज़र बूस्ट"
            },
            "health": {
                "en": "Health",
                "es": "Salud",
                "fr": "Santé",
                "de": "Gesundheit",
                "it": "Salute",
                "pt": "Vida",
                "ru": "Здоровье",
                "ja": "回復",
                "ko": "체력",
                "zh": "生命恢复",
                "ar": "الصحة",
                "hi": "स्वास्थ्य"
            },
            
            # Shop
            "buy": {
                "en": "BUY",
                "es": "COMPRAR",
                "fr": "ACHETER",
                "de": "KAUFEN",
                "it": "ACQUISTA",
                "pt": "COMPRAR",
                "ru": "КУПИТЬ",
                "ja": "購入",
                "ko": "구매",
                "zh": "购买",
                "ar": "شراء",
                "hi": "खरीदें"
            },
            "owned": {
                "en": "OWNED",
                "es": "ADQUIRIDO",
                "fr": "ACQUIS",
                "de": "IM BESITZ",
                "it": "POSSIEDI",
                "pt": "ADQUIRIDO",
                "ru": "ПРИОБРЕТЕНО",
                "ja": "所持",
                "ko": "보유중",
                "zh": "已拥有",
                "ar": "مملوك",
                "hi": "स्वामित्व"
            },
            "price": {
                "en": "Price",
                "es": "Precio",
                "fr": "Prix",
                "de": "Preis",
                "it": "Prezzo",
                "pt": "Preço",
                "ru": "Цена",
                "ja": "価格",
                "ko": "가격",
                "zh": "价格",
                "ar": "السعر",
                "hi": "कीमत"
            },
            "premium_ship": {
                "en": "Premium Ship",
                "es": "Nave Premium",
                "fr": "Vaisseau Premium",
                "de": "Premium-Schiff",
                "it": "Astronave Premium",
                "pt": "Nave Premium",
                "ru": "Премиум Корабль",
                "ja": "プレミアム船",
                "ko": "프리미엄 함선",
                "zh": "高级飞船",
                "ar": "السفينة المتميزة",
                "hi": "प्रीमियम जहाज"
            },
            "remove_ads": {
                "en": "Remove Ads",
                "es": "Quitar Anuncios",
                "fr": "Supprimer Pub",
                "de": "Werbung Entfernen",
                "it": "Rimuovi Pubblicità",
                "pt": "Remover Anúncios",
                "ru": "Убрать Рекламу",
                "ja": "広告削除",
                "ko": "광고 제거",
                "zh": "移除广告",
                "ar": "إزالة الإعلانات",
                "hi": "विज्ञापन हटाएं"
            },
            "level_pack": {
                "en": "Level Pack",
                "es": "Pack de Niveles",
                "fr": "Pack de Niveaux",
                "de": "Level-Paket",
                "it": "Pacchetto Livelli",
                "pt": "Pacote de Níveis",
                "ru": "Набор Уровней",
                "ja": "レベルパック",
                "ko": "레벨 팩",
                "zh": "关卡包",
                "ar": "حزمة المستويات",
                "hi": "स्तर पैक"
            },
            
            # Dialogs
            "are_you_sure": {
                "en": "Are you sure?",
                "es": "¿Estás seguro?",
                "fr": "Êtes-vous sûr ?",
                "de": "Bist du sicher?",
                "it": "Sei sicuro?",
                "pt": "Tem certeza?",
                "ru": "Вы уверены?",
                "ja": "よろしいですか？",
                "ko": "확실합니까?",
                "zh": "确定吗？",
                "ar": "هل أنت متأكد؟",
                "hi": "क्या आप निश्चित हैं?"
            },
            "yes": {
                "en": "YES",
                "es": "SÍ",
                "fr": "OUI",
                "de": "JA",
                "it": "SÌ",
                "pt": "SIM",
                "ru": "ДА",
                "ja": "はい",
                "ko": "예",
                "zh": "是",
                "ar": "نعم",
                "hi": "हाँ"
            },
            "no": {
                "en": "NO",
                "es": "NO",
                "fr": "NON",
                "de": "NEIN",
                "it": "NO",
                "pt": "NÃO",
                "ru": "НЕТ",
                "ja": "いいえ",
                "ko": "아니오",
                "zh": "否",
                "ar": "لا",
                "hi": "नहीं"
            },
            "ok": {
                "en": "OK",
                "es": "OK",
                "fr": "OK",
                "de": "OK",
                "it": "OK",
                "pt": "OK",
                "ru": "ОК",
                "ja": "OK",
                "ko": "확인",
                "zh": "确定",
                "ar": "حسناً",
                "hi": "ठीक"
            },
            "cancel": {
                "en": "CANCEL",
                "es": "CANCELAR",
                "fr": "ANNULER",
                "de": "ABBRECHEN",
                "it": "ANNULLA",
                "pt": "CANCELAR",
                "ru": "ОТМЕНА",
                "ja": "キャンセル",
                "ko": "취소",
                "zh": "取消",
                "ar": "إلغاء",
                "hi": "रद्द करें"
            },
            
            # Notifications
            "new_high_score": {
                "en": "NEW HIGH SCORE!",
                "es": "¡NUEVO RÉCORD!",
                "fr": "NOUVEAU RECORD !",
                "de": "NEUER REKORD!",
                "it": "NUOVO RECORD!",
                "pt": "NOVA PONTUAÇÃO MÁXIMA!",
                "ru": "НОВЫЙ РЕКОРД!",
                "ja": "新記録！",
                "ko": "새로운 최고 점수!",
                "zh": "新纪录！",
                "ar": "رقم قياسي جديد!",
                "hi": "नया उच्च स्कोर!"
            },
            "level_unlocked": {
                "en": "Level Unlocked!",
                "es": "¡Nivel Desbloqueado!",
                "fr": "Niveau Débloqué !",
                "de": "Level Freigeschaltet!",
                "it": "Livello Sbloccato!",
                "pt": "Nível Desbloqueado!",
                "ru": "Уровень Разблокирован!",
                "ja": "レベル解放！",
                "ko": "레벨 잠금 해제!",
                "zh": "关卡解锁！",
                "ar": "تم فتح المستوى!",
                "hi": "स्तर अनलॉक!"
            },
            "daily_reward": {
                "en": "Daily Reward Ready!",
                "es": "¡Recompensa Diaria Lista!",
                "fr": "Récompense Quotidienne Prête !",
                "de": "Tägliche Belohnung Bereit!",
                "it": "Ricompensa Giornaliera Pronta!",
                "pt": "Recompensa Diária Pronta!",
                "ru": "Ежедневная Награда Готова!",
                "ja": "デイリーリワード準備完了！",
                "ko": "일일 보상 준비 완료!",
                "zh": "每日奖励已准备好！",
                "ar": "المكافأة اليومية جاهزة!",
                "hi": "दैनिक पुरस्कार तैयार!"
            },
            
            # Tutorial
            "tutorial_move": {
                "en": "Drag to move your ship",
                "es": "Arrastra para mover tu nave",
                "fr": "Glissez pour déplacer votre vaisseau",
                "de": "Ziehen, um das Schiff zu bewegen",
                "it": "Trascina per muovere l'astronave",
                "pt": "Arraste para mover sua nave",
                "ru": "Перетаскивайте для движения корабля",
                "ja": "ドラッグして船を移動",
                "ko": "드래그하여 함선 이동",
                "zh": "拖动来移动飞船",
                "ar": "اسحب لتحريك سفينتك",
                "hi": "जहाज हिलाने के लिए खींचें"
            },
            "tutorial_shoot": {
                "en": "Auto-firing enabled!",
                "es": "¡Disparo automático activado!",
                "fr": "Tir automatique activé !",
                "de": "Automatisches Feuer aktiviert!",
                "it": "Sparo automatico attivato!",
                "pt": "Disparo automático ativado!",
                "ru": "Автоматическая стрельба включена!",
                "ja": "自動発射有効！",
                "ko": "자동 발사 활성화!",
                "zh": "自动射击已启用！",
                "ar": "الإطلاق التلقائي مفعل!",
                "hi": "स्वचालित गोलीबारी सक्षम!"
            },
            "tutorial_powerups": {
                "en": "Tap icons to use power-ups",
                "es": "Toca los iconos para usar potenciadores",
                "fr": "Appuyez sur les icônes pour utiliser les bonus",
                "de": "Tippe auf Symbole, um Power-ups zu nutzen",
                "it": "Tocca le icone per usare i potenziamenti",
                "pt": "Toque nos ícones para usar power-ups",
                "ru": "Нажмите на иконки для использования усилений",
                "ja": "アイコンをタップしてパワーアップを使用",
                "ko": "아이콘을 탭하여 파워업 사용",
                "zh": "点击图标使用道具",
                "ar": "اضغط على الأيقونات لاستخدام التعزيزات",
                "hi": "पावर-अप का उपयोग करने के लिए आइकन पर टैप करें"
            },
            
            # Errors
            "error_loading": {
                "en": "Error loading game data",
                "es": "Error al cargar datos del juego",
                "fr": "Erreur de chargement des données",
                "de": "Fehler beim Laden der Spieldaten",
                "it": "Errore caricamento dati di gioco",
                "pt": "Erro ao carregar dados do jogo",
                "ru": "Ошибка загрузки данных игры",
                "ja": "ゲームデータの読み込みエラー",
                "ko": "게임 데이터 로딩 오류",
                "zh": "加载游戏数据出错",
                "ar": "خطأ في تحميل بيانات اللعبة",
                "hi": "खेल डेटा लोड करने में त्रुटि"
            },
            "error_network": {
                "en": "Network connection required",
                "es": "Se requiere conexión de red",
                "fr": "Connexion réseau requise",
                "de": "Netzwerkverbindung erforderlich",
                "it": "Connessione di rete richiesta",
                "pt": "Conexão de rede necessária",
                "ru": "Требуется сетевое подключение",
                "ja": "ネットワーク接続が必要です",
                "ko": "네트워크 연결 필요",
                "zh": "需要网络连接",
                "ar": "الاتصال بالشبكة مطلوب",
                "hi": "नेटवर्क कनेक्शन आवश्यक"
            },
            "error_purchase": {
                "en": "Purchase failed. Please try again.",
                "es": "Compra fallida. Inténtalo de nuevo.",
                "fr": "Achat échoué. Veuillez réessayer.",
                "de": "Kauf fehlgeschlagen. Bitte erneut versuchen.",
                "it": "Acquisto fallito. Riprova.",
                "pt": "Compra falhou. Tente novamente.",
                "ru": "Покупка не удалась. Попробуйте снова.",
                "ja": "購入に失敗しました。もう一度お試しください。",
                "ko": "구매 실패. 다시 시도해 주세요.",
                "zh": "购买失败。请重试。",
                "ar": "فشل الشراء. يرجى المحاولة مرة أخرى.",
                "hi": "खरीदारी विफल। कृपया पुनः प्रयास करें।"
            }
        }
    
    def generate_language_file(self, lang_code):
        """Generate JSON file for single language"""
        lang_info = self.languages[lang_code]
        
        strings = {
            "_meta": {
                "language": lang_code,
                "name": lang_info["name"],
                "nativeName": lang_info["native"],
                "rtl": lang_info["rtl"],
                "version": "1.0.0"
            }
        }
        
        # Add all translations for this language
        for key, translations in self.translations.items():
            strings[key] = translations.get(lang_code, translations["en"])
        
        # Save
        path = os.path.join(self.output_dir, f"{lang_code}.json")
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(strings, f, ensure_ascii=False, indent=2)
        
        print(f"✅ {lang_code}: {lang_info['native']} ({len(strings)-1} strings)")
        return path
    
    def generate_android_xml(self):
        """Generate Android strings.xml with all languages"""
        android_dir = os.path.join(self.output_dir, "android")
        os.makedirs(android_dir, exist_ok=True)
        
        # Default English
        lines = ['<?xml version="1.0" encoding="utf-8"?>', '<resources>']
        
        for key, translations in self.translations.items():
            # Android resource naming convention
            android_key = key.replace('_', '_').lower()
            value = translations["en"].replace("'", "\\'").replace('"', '\\"')
            lines.append(f'    <string name="{android_key}">{value}</string>')
        
        lines.append('</resources>')
        
        path = os.path.join(android_dir, "strings.xml")
        with open(path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines))
        
        print(f"\n✅ Android: strings.xml")
        
        # Generate translations for other languages
        for lang_code in ["es", "fr", "de", "it", "pt", "ru", "ja", "ko", "zh", "ar", "hi"]:
            values_dir = os.path.join(android_dir, f"values-{lang_code}")
            os.makedirs(values_dir, exist_ok=True)
            
            lines = ['<?xml version="1.0" encoding="utf-8"?>', '<resources>']
            
            for key, translations in self.translations.items():
                android_key = key.replace('_', '_').lower()
                value = translations.get(lang_code, translations["en"])
                value = value.replace("'", "\\'").replace('"', '\\"')
                lines.append(f'    <string name="{android_key}">{value}</string>')
            
            lines.append('</resources>')
            
            path = os.path.join(values_dir, "strings.xml")
            with open(path, 'w', encoding='utf-8') as f:
                f.write('\n'.join(lines))
            
            print(f"✅ Android: values-{lang_code}/strings.xml")
    
    def generate_web_json(self):
        """Generate combined JSON for web/PWA"""
        web_data = {
            "languages": {},
            "strings": {}
        }
        
        # Build language list
        for code, info in self.languages.items():
            web_data["languages"][code] = {
                "name": info["name"],
                "nativeName": info["native"],
                "rtl": info["rtl"]
            }
        
        # Organize strings by key with all translations
        for key, translations in self.translations.items():
            web_data["strings"][key] = translations
        
        path = os.path.join(self.output_dir, "web", "strings.json")
        os.makedirs(os.path.dirname(path), exist_ok=True)
        
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(web_data, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ Web: strings.json")
    
    def generate_all(self):
        """Generate all localization files"""
        print("🌐 Generating Localization Files...\n")
        
        # Individual language files
        for lang_code in self.languages.keys():
            self.generate_language_file(lang_code)
        
        # Platform-specific formats
        print("\n📱 Generating platform-specific formats...")
        self.generate_android_xml()
        self.generate_web_json()
        
        # Summary
        print(f"\n{'='*50}")
        print(f"✅ Generated {len(self.languages)} languages")
        print(f"✅ {len(self.translations)} string keys")
        print(f"{'='*50}")
        print(f"\n📁 Output: {self.output_dir}")


if __name__ == "__main__":
    gen = LocalizationGenerator()
    gen.generate_all()
