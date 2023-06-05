import { useRouter } from 'next/router';

import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';

import ProjectTemplate from 'src/types/projectTemplate.interface';
import styles from './styles/templates.module.css';
import { IconButton } from 'src/components/iconButton';
import clsx from 'clsx';
import React from 'react';
import { Tooltip, TooltipPosition } from 'src/components/tooltip';

type TemplateDetailProps = {
	template: ProjectTemplate
	highlighted?: boolean
	disableHover?: boolean
	style?: React.CSSProperties
	onDeleteBtnClick: () => void
	onCloneBtnClick: () => void
	onClick?: () => void
}

const iconSize = 25;

export default function TemplateDetail (props: TemplateDetailProps) {
	const {
		template,
		highlighted = false,
		disableHover = false,
		style,
		onDeleteBtnClick,
		onCloneBtnClick,
		onClick,
	} = props;
	const router = useRouter();
	const dateTimeDisplay = template.updatedAt ? new Date(template.updatedAt).toLocaleString('en-GB') : undefined;

	return (
		<div className={clsx(
			styles.templateDetailsCard,
			highlighted ? styles.card__highlighted : null,
			disableHover ? styles.card__disableHover: null,
		)}
		style={style}>
			<div className={styles.mainContent} onClick={onClick}>
				<Tooltip content={template.projectInfo.name}
					position={TooltipPosition.top}
					backgroundColor='#676767'
					fontColor='#FFFFFF'
					offsetTop={-10}>
					<div className={styles.heading}>{template.projectInfo.name}</div>
				</Tooltip>
				{template.projectInfo.description ? <Tooltip content={template.projectInfo.description}
					position={TooltipPosition.bottom}
					backgroundColor='#676767'
					fontColor='#FFFFFF'
					offsetTop={5}>
					<div className={styles.description}>{template.projectInfo.description}</div>
				</Tooltip> : null}
				{template.projectInfo.company ?
					<div className={styles.author}>
						<span>Author: </span>{template.projectInfo.company}
					</div> : null 
				}
				{dateTimeDisplay ? 
					<div className={styles.updatedAt}>Updated on {dateTimeDisplay}</div> : null}
			</div>
			<div className={styles.verticalDivider} />
			<div className={styles.btnColumn}>
				{template.fromPlugin ? (
					<Tooltip content="View Project Template"
						backgroundColor='#676767'
						fontColor='#FFFFFF'
						offsetLeft={-20}>
						<IconButton
							rounded
							noOutline
							iconComponent={VisibilityIcon}
							iconFontSize={iconSize}
							style={{ margin: '10px 0px'}}
							data-testid="view-project-template" 
							onClick={() => router.push(`/projectTemplate/${template.id}`)}>
						</IconButton>
					</Tooltip>
				):(
					<Tooltip content="Edit Project Template"
						backgroundColor='#676767'
						fontColor='#FFFFFF'
						offsetLeft={-20}>
						<IconButton
							rounded
							noOutline
							iconComponent={EditIcon}
							iconFontSize={iconSize}
							style={{ margin: '10px 0px'}}
							data-testid="edit-project-template" 
							onClick={() => router.push(`/projectTemplate/${template.id}`)}>
						</IconButton>
					</Tooltip>
				)}
				<Tooltip content="Copy Project Template to new instance"
					backgroundColor='#676767'
					fontColor='#FFFFFF'
					offsetLeft={-20}>
					<IconButton
						rounded
						noOutline
						iconComponent={ContentCopyIcon}
						iconFontSize={iconSize}
						style={{ margin: '10px 0px'}}
						onClick={onCloneBtnClick}>
					</IconButton>
				</Tooltip>
				<Tooltip content="Delete Project Template"
					backgroundColor='#676767'
					fontColor='#FFFFFF'
					offsetLeft={-20}>
					<IconButton
						rounded
						noOutline
						iconComponent={DeleteIcon}
						iconFontSize={iconSize}
						style={{ margin: '10px 0px'}}
						onClick={onDeleteBtnClick} disabled={template.fromPlugin}>
					</IconButton>
				</Tooltip>
			</div>
		</div>
	)
}
