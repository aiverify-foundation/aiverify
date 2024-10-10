import { ReactElement } from 'react';
import styles from './styles/icon.module.css';

import { AlertIcon } from './icons/alert-icon';
import { ArrowLeftIcon } from './icons/arrow-left-icon';
import { WideArrowLeftIcon } from './icons/wide-arrow-left-icon';
import { ArrowRightIcon } from './icons/arrow-right-icon';
import { WideArrowRightIcon } from './icons/wide-arrow-right-icon';
import { AsteriskIcon } from './icons/asterisk-icon';
import { BellIcon } from './icons/bell-icon';
import { BookIcon } from './icons/book-icon';
import { SolidBoxIcon } from './icons/solid-box-icon';
import { OutlineBoxIcon } from './icons/outline-box-icon';
import { BurgerMenuIcon } from './icons/burger-menu-icon';
import { ChatBubbleWideIcon } from './icons/chat-bubble-wide-icon';
import { ChatBubblesIcon } from './icons/chat-bubbles-icon';
import { CheckListIcon } from './icons/checklist-icon';
import { CircleArrowLeftIcon } from './icons/circle-arrow-left-icon';
import { CircleArrowRightIcon } from './icons/circle-arrow-right-icon';
import { CloseIcon } from './icons/close-x-icon';
import { DarkMoonIcon } from './icons/dark-moon-icon';
import { DocumentIcon } from './icons/document-icon';
import { FileIcon } from './icons/file-icon';
import { FolderForChatSessionsIcon } from './icons/folder-chat-icon';
import { FolderIcon } from './icons/folder-icon';
import { HistoryClockIcon } from './icons/history-clock-icon';
import { LayoutColumnsIcon } from './icons/layout-columns-icon';
import { LayoutWtfIcon } from './icons/layout-wtf-icon';
import { LightBulb } from './icons/light-bulb-icon';
import { LightSunIcon } from './icons/light-sun-icon';
import { LightningIcon } from './icons/lightning-icon';
import { ListIcon } from './icons/list-icon';
import { MaximizeIcon } from './icons/maximize-icon';
import { MinimizeIcon } from './icons/minimize-icon';
import { MoonshotAttackStrategyIcon } from './icons/ms-attack-icon';
import { MoonshotPromptTemplateIcon } from './icons/ms-prompt-template-icon';
import { PencilIcon } from './icons/pencil-icon';
import { PlusIcon } from './icons/plus-icon';
import { ResetIcon } from './icons/reset-icon';
import { RibbonIcon } from './icons/ribbon-icon';
import { RunCookbookIcon } from './icons/run-cookbook-icon';
import { SpacesuitIcon } from './icons/spacesuit-icon';
import { SquareIcon } from './icons/square-icon';
import { TableIcon } from './icons/table-icon';
import { TalkBubblesIcon } from './icons/talkbubbles-icon';
import { ToolsIcon } from './icons/tools-icon';
import { WarningIcon } from './icons/warning-icon';
import { WideArrowDownIcon } from './icons/wide-arrow-down';
import { WideArrowUpIcon } from './icons/wide-arrow-up';
import clsx from 'clsx';

enum IconName {
  Alert = 'Alert',
  ArrowLeft = 'ArrowLeft',
  ArrowRight = 'ArrowRight',
  Asterisk = 'Asterisk',
  Bell = 'Bell',
  Book = 'Book',
  BurgerMenu = 'BurgerMenu',
  ChatBubbleWide = 'ChatBubbleWide',
  ChatBubbles = 'ChatBubbles',
  CheckList = 'CheckList',
  CircleArrowLeft = 'CircleArrowLeft',
  CircleArrowRight = 'CircleArrowRight',
  Close = 'Close',
  DarkMoon = 'DarkMoon',
  Document = 'Document',
  File = 'File',
  Folder = 'Folder',
  FolderForChatSessions = 'FolderForChatSessions',
  HistoryClock = 'HistoryClock',
  LayoutColumns = 'LayoutColumns',
  LayoutWtf = 'LayoutWtf',
  LightBulb = 'LightBulb',
  LightSun = 'LightSun',
  Lightning = 'Lightning',
  List = 'List',
  Maximize = 'Maximize',
  Minimize = 'Minimize',
  MoonAttackStrategy = 'MoonAttackStrategy',
  MoonPromptTemplate = 'MoonPromptTemplate',
  OutlineBox = 'OutlineBox',
  Pencil = 'Pencil',
  Plus = 'Plus',
  Reset = 'Reset',
  Ribbon = 'Ribbon',
  RunCookbook = 'RunCookbook',
  SolidBox = 'SolidBox',
  Spacesuit = 'Spacesuit',
  Square = 'Square',
  Table = 'Table',
  TalkBubbles = 'TalkBubbles',
  Tools = 'Tools',
  Warning = 'Warning',
  WideArrowDown = 'WideArrowDown',
  WideArrowLeft = 'WideArrowLeft',
  WideArrowRight = 'WideArrowRight',
  WideArrowUp = 'WideArrowUp',
}

type BaseIconProps = {
  name: IconName;
  role?: string;
  ariaLabel?: string;
  size?: number;
  disabled?: boolean;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
};

type WithColor = BaseIconProps & {
  color: string;
  svgClassName?: never;
};

type WithClassName = BaseIconProps & {
  svgClassName: `stroke-${string} dark:stroke-${string}` | `fill-${string} dark:fill-${string}`;
  color?: never;
};

type IconProps = WithColor | WithClassName;

function Icon(props: IconProps) {
  const {
    name,
    role,
    ariaLabel,
    onClick,
    onMouseDown,
    disabled = false,
    size = 20,
    style,
    color = '#000000',
    svgClassName,
  } = props;

  let iconToRender: ReactElement | null = null;

  switch (name) {
    case IconName.Alert:
      iconToRender = (
        <AlertIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.Folder:
      iconToRender = (
        <FolderIcon
          backColor="#2980b9"
          frontColor="#3498db"
          midColor="#bdc3c7"
          width={size}
          height={size}
        />
      );
      break;
    case IconName.FolderForChatSessions:
      iconToRender = (
        <FolderForChatSessionsIcon
          backColor="#2980b9"
          frontColor="#3498db"
          midColor="#bdc3c7"
          chatIconColor="#2980b9"
          width={size}
          height={size}
        />
      );
      break;
    case IconName.ChatBubbles:
      iconToRender = (
        <ChatBubblesIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.RunCookbook:
      iconToRender = (
        <RunCookbookIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.BurgerMenu:
      iconToRender = (
        <BurgerMenuIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.DarkMoon:
      iconToRender = (
        <DarkMoonIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.LightSun:
      iconToRender = (
        <LightSunIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.Close:
      iconToRender = (
        <CloseIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.WideArrowLeft:
      iconToRender = (
        <WideArrowLeftIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.WideArrowRight:
      iconToRender = (
        <WideArrowRightIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.CircleArrowRight:
      iconToRender = (
        <CircleArrowRightIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.CircleArrowLeft:
      iconToRender = (
        <CircleArrowLeftIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.Maximize:
      iconToRender = (
        <MaximizeIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.Minimize:
      iconToRender = (
        <MinimizeIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.LayoutWtf:
      iconToRender = (
        <LayoutWtfIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.LayoutColumns:
      iconToRender = (
        <LayoutColumnsIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.ChatBubbleWide:
      iconToRender = (
        <ChatBubbleWideIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.Reset:
      iconToRender = (
        <ResetIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.SolidBox:
      iconToRender = (
        <SolidBoxIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.OutlineBox:
      iconToRender = (
        <OutlineBoxIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.Plus:
      iconToRender = <PlusIcon width={size} height={size} className={svgClassName} color={color} />;
      break;
    case IconName.Square:
      iconToRender = (
        <SquareIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.List:
      iconToRender = <ListIcon width={size} height={size} className={svgClassName} color={color} />;
      break;
    case IconName.File:
      iconToRender = <FileIcon width={size} height={size} className={svgClassName} color={color} />;
      break;
    case IconName.Book:
      iconToRender = <BookIcon width={size} height={size} className={svgClassName} color={color} />;
      break;
    case IconName.ArrowLeft:
      iconToRender = (
        <ArrowLeftIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.ArrowRight:
      iconToRender = (
        <ArrowRightIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.Table:
      iconToRender = (
        <TableIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.Bell:
      iconToRender = <BellIcon width={size} height={size} className={svgClassName} color={color} />;
      break;
    case IconName.Asterisk:
      iconToRender = (
        <AsteriskIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.CheckList:
      iconToRender = (
        <CheckListIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.Spacesuit:
      iconToRender = (
        <SpacesuitIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.HistoryClock:
      iconToRender = (
        <HistoryClockIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.Tools:
      iconToRender = (
        <ToolsIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.Lightning:
      iconToRender = (
        <LightningIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.WideArrowDown:
      iconToRender = (
        <WideArrowDownIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.WideArrowUp:
      iconToRender = (
        <WideArrowUpIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.LightBulb:
      iconToRender = (
        <LightBulb width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.Ribbon:
      iconToRender = (
        <RibbonIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.TalkBubbles:
      iconToRender = (
        <TalkBubblesIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.Document:
      iconToRender = (
        <DocumentIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.Warning:
      iconToRender = (
        <WarningIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.Pencil:
      iconToRender = (
        <PencilIcon width={size} height={size} className={svgClassName} color={color} />
      );
      break;
    case IconName.MoonPromptTemplate:
      iconToRender = (
        <MoonshotPromptTemplateIcon
          width={size}
          height={size}
          className={svgClassName}
          color={color}
        />
      );
      break;
    case IconName.MoonAttackStrategy:
      iconToRender = (
        <MoonshotAttackStrategyIcon
          width={size}
          height={size}
          className={svgClassName}
          color={color}
        />
      );
      break;
    default:
      iconToRender = null;
  }

  const cssClass = clsx(
    styles.icon_wrapper,
    onClick ? styles.pointer_effect : '',
    disabled ? styles.disabled : '',
  );

  return (
    <div
      role={role}
      aria-label={ariaLabel}
      className={cssClass}
      style={{
        width: size,
        height: size,
        ...style,
      }}
      onClick={disabled ? undefined : onClick}
      onMouseDown={disabled ? undefined : onMouseDown}
    >
      {iconToRender}
    </div>
  );
}

export { Icon, IconName };
