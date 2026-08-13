namespace UmdBatteryTray;

/// <summary>UI language codes aligned with umdrivers.com.</summary>
internal static class UiLang
{
    public const string Pl = "pl";
    public const string En = "en";
    public const string De = "de";
    public const string Fr = "fr";
    public const string Es = "es";
    public const string Pt = "pt";
    public const string It = "it";
    public const string Zh = "zh";
    public const string Ja = "ja";
    public const string Ko = "ko";
    public const string Ru = "ru";

    public static readonly string[] All =
    [
        Pl, En, De, Fr, Es, Pt, It, Zh, Ja, Ko, Ru,
    ];

    public static readonly (string Code, string NativeName)[] Choices =
    [
        (Pl, "Polski"),
        (En, "English"),
        (De, "Deutsch"),
        (Fr, "Français"),
        (Es, "Español"),
        (Pt, "Português"),
        (It, "Italiano"),
        (Zh, "中文"),
        (Ja, "日本語"),
        (Ko, "한국어"),
        (Ru, "Русский"),
    ];

    public static string Normalize(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return En;
        var s = raw.Trim().ToLowerInvariant().Replace('_', '-');
        var primary = s.Split('-')[0];
        foreach (var code in All)
        {
            if (s == code || primary == code)
                return code;
        }
        return En;
    }

    /// <summary>Best effort from Windows UI culture.</summary>
    public static string FromOs()
    {
        try
        {
            var name = System.Globalization.CultureInfo.CurrentUICulture.Name;
            return Normalize(name);
        }
        catch
        {
            return En;
        }
    }
}

internal static class UiText
{
    private static readonly Dictionary<string, Dictionary<string, string>> Catalog = Build();

    public static string T(string lang, string key)
    {
        lang = UiLang.Normalize(lang);
        if (Catalog.TryGetValue(lang, out var map) && map.TryGetValue(key, out var v))
            return v;
        if (Catalog[UiLang.En].TryGetValue(key, out var en))
            return en;
        return key;
    }

    private static Dictionary<string, Dictionary<string, string>> Build()
    {
        var en = new Dictionary<string, string>
        {
            ["settings.title"] = "UMD Battery - Settings",
            ["settings.mouse"] = "Mouse (battery source)",
            ["settings.mouseHint"] = "When both mice are plugged in, pick which battery to show.",
            ["settings.refreshList"] = "Refresh list",
            ["settings.trayIcon"] = "Tray icon",
            ["settings.batteryIcon"] = "Battery icon",
            ["settings.percentOnly"] = "Percent only",
            ["settings.batteryPercent"] = "Battery + percent",
            ["settings.fontSize"] = "Font size:",
            ["settings.iconSize"] = "Icon size:",
            ["settings.widget"] = "Desktop widget",
            ["settings.showWidget"] = "Show desktop widget",
            ["settings.dragWidget"] = "Allow dragging widget",
            ["settings.position"] = "Position (X, Y):",
            ["settings.resetPos"] = "Reset position",
            ["settings.useCurrent"] = "Use current",
            ["settings.size"] = "Size:",
            ["settings.bgOpacity"] = "Background opacity:",
            ["settings.fontOpacity"] = "Font opacity:",
            ["settings.startup"] = "Startup & updates",
            ["settings.poll"] = "Refresh interval (sec):",
            ["settings.autostart"] = "Start with Windows (autostart UMD Battery Tray)",
            ["settings.autoUpdate"] = "Check for updates on start",
            ["settings.language"] = "Language",
            ["settings.ok"] = "OK",
            ["settings.cancel"] = "Cancel",
            ["settings.apply"] = "Apply",
            ["tray.menuSettings"] = "Settings…",
            ["tray.menuOpenSite"] = "Open UMD (umdrivers.com)",
            ["tray.menuCheckUpdates"] = "Check for updates…",
            ["tray.menuExit"] = "Exit",
            ["tray.starting"] = "UMD Battery - starting…",
            ["tray.refreshNow"] = "Refresh now",
            ["tray.noData"] = "UMD: no battery data",
            ["update.title"] = "UMD Battery - Updates",
            ["update.checking"] = "Checking for updates…",
            ["update.upToDate"] = "You are up to date (v{0}).",
            ["update.available"] = "Update available:\n\nv{0}  →  v{1}\n\nDownload and install now?",
            ["update.yes"] = "Yes, update",
            ["update.no"] = "Not now",
            ["update.close"] = "Close",
            ["update.downloading"] = "Downloading v{0}…\nThe app will restart when ready.",
            ["update.downloadFailed"] = "Update failed:\n{0}",
            ["update.error"] = "Could not check for updates:\n{0}",
            ["widget.connecting"] = "Connecting…",
            ["widget.noData"] = "No data",
            ["widget.title"] = "UMD Battery",
        };

        Dictionary<string, string> Copy(Dictionary<string, string> src) =>
            new(src, StringComparer.Ordinal);

        var de = Copy(en);
        de["settings.title"] = "UMD Battery - Einstellungen";
        de["settings.mouse"] = "Maus (Akkuquelle)";
        de["settings.mouseHint"] = "Wenn mehrere Mäuse verbunden sind, wähle welche Batterie angezeigt wird.";
        de["settings.refreshList"] = "Liste aktualisieren";
        de["settings.trayIcon"] = "Tray-Symbol";
        de["settings.batteryIcon"] = "Batterie-Symbol";
        de["settings.percentOnly"] = "Nur Prozent";
        de["settings.batteryPercent"] = "Batterie + Prozent";
        de["settings.fontSize"] = "Schriftgröße:";
        de["settings.iconSize"] = "Symbolgröße:";
        de["settings.widget"] = "Desktop-Widget";
        de["settings.showWidget"] = "Desktop-Widget anzeigen";
        de["settings.dragWidget"] = "Widget verschieben erlauben";
        de["settings.position"] = "Position (X, Y):";
        de["settings.resetPos"] = "Position zurücksetzen";
        de["settings.useCurrent"] = "Aktuelle übernehmen";
        de["settings.size"] = "Größe:";
        de["settings.bgOpacity"] = "Hintergrunddeckkraft:";
        de["settings.fontOpacity"] = "Schriftdeckkraft:";
        de["settings.startup"] = "Autostart & Updates";
        de["settings.poll"] = "Aktualisierungsintervall (Sek.):";
        de["settings.autostart"] = "Mit Windows starten (UMD Battery Tray)";
        de["settings.autoUpdate"] = "Beim Start nach Updates suchen";
        de["settings.language"] = "Sprache";
        de["settings.ok"] = "OK";
        de["settings.cancel"] = "Abbrechen";
        de["tray.menuSettings"] = "Einstellungen…";
        de["tray.menuOpenSite"] = "UMD öffnen (umdrivers.com)";
        de["tray.menuCheckUpdates"] = "Nach Updates suchen…";
        de["tray.menuExit"] = "Beenden";
        de["tray.refreshNow"] = "Jetzt aktualisieren";
        de["tray.starting"] = "UMD Battery - startet…";
        de["tray.noData"] = "UMD: keine Akkudaten";
        de["update.title"] = "UMD Battery - Updates";
        de["update.checking"] = "Suche nach Updates…";
        de["update.upToDate"] = "Du bist auf dem neuesten Stand (v{0}).";
        de["update.available"] = "Update verfügbar:\n\nv{0}  →  v{1}\n\nJetzt herunterladen und installieren?";
        de["update.yes"] = "Ja, aktualisieren";
        de["update.no"] = "Nicht jetzt";
        de["update.close"] = "Schließen";
        de["update.downloading"] = "Lade v{0} herunter…\nDie App startet neu, wenn fertig.";
        de["update.downloadFailed"] = "Update fehlgeschlagen:\n{0}";
        de["update.error"] = "Update-Prüfung fehlgeschlagen:\n{0}";
        de["widget.connecting"] = "Verbinden…";
        de["widget.noData"] = "Keine Daten";
        de["settings.apply"] = "Übernehmen";

        var fr = Copy(en);
        fr["settings.title"] = "UMD Battery - Paramètres";
        fr["settings.mouse"] = "Souris (source batterie)";
        fr["settings.mouseHint"] = "Si plusieurs souris sont branchées, choisissez laquelle afficher.";
        fr["settings.refreshList"] = "Actualiser la liste";
        fr["settings.trayIcon"] = "Icône de la barre";
        fr["settings.batteryIcon"] = "Icône batterie";
        fr["settings.percentOnly"] = "Pourcentage seul";
        fr["settings.batteryPercent"] = "Batterie + pourcentage";
        fr["settings.fontSize"] = "Taille du texte :";
        fr["settings.iconSize"] = "Taille de l’icône :";
        fr["settings.widget"] = "Widget bureau";
        fr["settings.showWidget"] = "Afficher le widget";
        fr["settings.dragWidget"] = "Autoriser le déplacement";
        fr["settings.position"] = "Position (X, Y) :";
        fr["settings.resetPos"] = "Réinitialiser";
        fr["settings.useCurrent"] = "Position actuelle";
        fr["settings.size"] = "Taille :";
        fr["settings.bgOpacity"] = "Opacité du fond :";
        fr["settings.fontOpacity"] = "Opacité du texte :";
        fr["settings.startup"] = "Démarrage & mises à jour";
        fr["settings.poll"] = "Intervalle (sec) :";
        fr["settings.autostart"] = "Démarrer avec Windows";
        fr["settings.autoUpdate"] = "Vérifier les mises à jour au démarrage";
        fr["settings.language"] = "Langue";
        fr["settings.cancel"] = "Annuler";
        fr["tray.menuSettings"] = "Paramètres…";
        fr["tray.menuOpenSite"] = "Ouvrir UMD (umdrivers.com)";
        fr["tray.menuCheckUpdates"] = "Rechercher des mises à jour…";
        fr["tray.menuExit"] = "Quitter";
        fr["tray.refreshNow"] = "Actualiser";
        fr["tray.starting"] = "UMD Battery - démarrage…";
        fr["tray.noData"] = "UMD : pas de données batterie";
        fr["update.title"] = "UMD Battery - Mises à jour";
        fr["update.checking"] = "Recherche de mises à jour…";
        fr["update.upToDate"] = "Vous êtes à jour (v{0}).";
        fr["update.available"] = "Mise à jour disponible :\n\nv{0}  →  v{1}\n\nTélécharger et installer maintenant ?";
        fr["update.yes"] = "Oui, mettre à jour";
        fr["update.no"] = "Pas maintenant";
        fr["update.close"] = "Fermer";
        fr["update.downloading"] = "Téléchargement de v{0}…\nL’app redémarrera ensuite.";
        fr["update.downloadFailed"] = "Échec de la mise à jour :\n{0}";
        fr["update.error"] = "Impossible de vérifier :\n{0}";
        fr["widget.connecting"] = "Connexion…";
        fr["widget.noData"] = "Aucune donnée";
        fr["settings.apply"] = "Appliquer";

        var es = Copy(en);
        es["settings.title"] = "UMD Battery - Ajustes";
        es["settings.mouse"] = "Ratón (fuente de batería)";
        es["settings.mouseHint"] = "Si hay varios ratones, elige cuál mostrar.";
        es["settings.refreshList"] = "Actualizar lista";
        es["settings.trayIcon"] = "Icono de bandeja";
        es["settings.batteryIcon"] = "Icono de batería";
        es["settings.percentOnly"] = "Solo porcentaje";
        es["settings.batteryPercent"] = "Batería + porcentaje";
        es["settings.fontSize"] = "Tamaño de fuente:";
        es["settings.iconSize"] = "Tamaño del icono:";
        es["settings.widget"] = "Widget de escritorio";
        es["settings.showWidget"] = "Mostrar widget";
        es["settings.dragWidget"] = "Permitir mover el widget";
        es["settings.position"] = "Posición (X, Y):";
        es["settings.resetPos"] = "Restablecer posición";
        es["settings.useCurrent"] = "Usar actual";
        es["settings.size"] = "Tamaño:";
        es["settings.bgOpacity"] = "Opacidad del fondo:";
        es["settings.fontOpacity"] = "Opacidad del texto:";
        es["settings.startup"] = "Inicio y actualizaciones";
        es["settings.poll"] = "Intervalo (seg):";
        es["settings.autostart"] = "Iniciar con Windows";
        es["settings.autoUpdate"] = "Buscar actualizaciones al iniciar";
        es["settings.language"] = "Idioma";
        es["settings.cancel"] = "Cancelar";
        es["tray.menuSettings"] = "Ajustes…";
        es["tray.menuOpenSite"] = "Abrir UMD (umdrivers.com)";
        es["tray.menuCheckUpdates"] = "Buscar actualizaciones…";
        es["tray.menuExit"] = "Salir";
        es["tray.refreshNow"] = "Actualizar ahora";
        es["tray.starting"] = "UMD Battery - iniciando…";
        es["tray.noData"] = "UMD: sin datos de batería";
        es["update.title"] = "UMD Battery - Actualizaciones";
        es["update.checking"] = "Buscando actualizaciones…";
        es["update.upToDate"] = "Estás al día (v{0}).";
        es["update.available"] = "Actualización disponible:\n\nv{0}  →  v{1}\n\n¿Descargar e instalar ahora?";
        es["update.yes"] = "Sí, actualizar";
        es["update.no"] = "Ahora no";
        es["update.close"] = "Cerrar";
        es["update.downloading"] = "Descargando v{0}…\nLa app se reiniciará al terminar.";
        es["update.downloadFailed"] = "Error al actualizar:\n{0}";
        es["update.error"] = "No se pudo comprobar:\n{0}";
        es["widget.connecting"] = "Conectando…";
        es["widget.noData"] = "Sin datos";
        es["settings.apply"] = "Aplicar";

        var pl = Copy(en);
        pl["settings.title"] = "UMD Battery - Ustawienia";
        pl["settings.mouse"] = "Mysz (źródło baterii)";
        pl["settings.mouseHint"] = "Gdy podłączonych jest kilka myszy, wybierz którą baterię pokazywać.";
        pl["settings.refreshList"] = "Odśwież listę";
        pl["settings.trayIcon"] = "Ikona w trayu";
        pl["settings.batteryIcon"] = "Ikona baterii";
        pl["settings.percentOnly"] = "Tylko procent";
        pl["settings.batteryPercent"] = "Bateria + procent";
        pl["settings.fontSize"] = "Rozmiar czcionki:";
        pl["settings.iconSize"] = "Rozmiar ikony:";
        pl["settings.widget"] = "Widget pulpitu";
        pl["settings.showWidget"] = "Pokaż widget";
        pl["settings.dragWidget"] = "Pozwól przeciągać widget";
        pl["settings.position"] = "Pozycja (X, Y):";
        pl["settings.resetPos"] = "Reset pozycji";
        pl["settings.useCurrent"] = "Użyj bieżącej";
        pl["settings.size"] = "Rozmiar:";
        pl["settings.bgOpacity"] = "Krycie tła:";
        pl["settings.fontOpacity"] = "Krycie tekstu:";
        pl["settings.startup"] = "Autostart i aktualizacje";
        pl["settings.poll"] = "Interwał (s):";
        pl["settings.autostart"] = "Uruchom z Windows";
        pl["settings.autoUpdate"] = "Sprawdzaj aktualizacje przy starcie";
        pl["settings.language"] = "Język";
        pl["settings.cancel"] = "Anuluj";
        pl["tray.menuSettings"] = "Ustawienia…";
        pl["tray.menuOpenSite"] = "Otwórz UMD (umdrivers.com)";
        pl["tray.menuCheckUpdates"] = "Sprawdź aktualizacje…";
        pl["tray.menuExit"] = "Zakończ";
        pl["tray.refreshNow"] = "Odśwież teraz";
        pl["tray.starting"] = "UMD Battery - uruchamianie…";
        pl["tray.noData"] = "UMD: brak danych baterii";
        pl["update.title"] = "UMD Battery - Aktualizacje";
        pl["update.checking"] = "Sprawdzanie aktualizacji…";
        pl["update.upToDate"] = "Masz najnowszą wersję (v{0}).";
        pl["update.available"] = "Dostępna aktualizacja:\n\nv{0}  →  v{1}\n\nPobrać i zainstalować teraz?";
        pl["update.yes"] = "Tak, aktualizuj";
        pl["update.no"] = "Nie teraz";
        pl["update.close"] = "Zamknij";
        pl["update.downloading"] = "Pobieranie v{0}…\nAplikacja uruchomi się ponownie po zakończeniu.";
        pl["update.downloadFailed"] = "Aktualizacja nieudana:\n{0}";
        pl["update.error"] = "Nie udało się sprawdzić aktualizacji:\n{0}";
        pl["widget.connecting"] = "Łączenie…";
        pl["widget.noData"] = "Brak danych";
        pl["settings.apply"] = "Zastosuj";

        // Remaining locales fall back to English for tray UI except language label.
        var pt = Copy(en); pt["settings.language"] = "Idioma";
        var it = Copy(en); it["settings.language"] = "Lingua";
        var zh = Copy(en); zh["settings.language"] = "语言"; zh["settings.title"] = "UMD Battery - 设置";
        var ja = Copy(en); ja["settings.language"] = "言語"; ja["settings.title"] = "UMD Battery - 設定";
        var ko = Copy(en); ko["settings.language"] = "언어"; ko["settings.title"] = "UMD Battery - 설정";
        var ru = Copy(en); ru["settings.language"] = "Язык"; ru["settings.title"] = "UMD Battery - Настройки";

        return new Dictionary<string, Dictionary<string, string>>(StringComparer.Ordinal)
        {
            [UiLang.En] = en,
            [UiLang.De] = de,
            [UiLang.Fr] = fr,
            [UiLang.Es] = es,
            [UiLang.Pl] = pl,
            [UiLang.Pt] = pt,
            [UiLang.It] = it,
            [UiLang.Zh] = zh,
            [UiLang.Ja] = ja,
            [UiLang.Ko] = ko,
            [UiLang.Ru] = ru,
        };
    }
}
