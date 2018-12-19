import { GameAction, GameActionProperties } from './GameAction';
import AbilityContext = require('../AbilityContext');

interface ChooseGameChoices {
    [choice: string]: GameAction | GameAction[];
}

export interface ChooseActionProperties extends GameActionProperties {
    activePromptTitle?: string;
    choices: ChooseGameChoices;
    messages: object;
}

interface ChooseGameChoicesInternal {
    [choice: string]: GameAction[];
}

interface ChooseActionPropertiesInternal extends GameActionProperties {
    activePromptTitle?: string;
    choices: ChooseGameChoicesInternal;
    messages: object;
}

export class ChooseGameAction extends GameAction {
    effect = 'choose between different actions';
    defaultProperties: ChooseActionProperties = {
        activePromptTitle: 'Select an action:',
        choices: {},
        messages: {}
    };
    constructor(properties: ChooseActionProperties | ((context: AbilityContext) => ChooseActionProperties)) {
        super(properties);
    }

    getProperties(context: AbilityContext): ChooseActionPropertiesInternal {
        let properties = super.getProperties(context) as ChooseActionProperties;
        for(const key of Object.keys(properties.choices)) {
            if(!Array.isArray(properties.choices[key])) {
                properties.choices[key] = [properties.choices[key]] as GameAction[];
            }
            for(const action of properties.choices[key] as GameAction[]) {
                action.setDefaultTarget(this.getDefaultTargets);
            }
        }
        return properties as ChooseActionPropertiesInternal;
    }

    hasLegalTarget(context: AbilityContext): boolean {
        let properties = this.getProperties(context);
        return Object.values(properties.choices).some(
            (array: GameAction[]): boolean => array.some(
                (gameAction: GameAction): boolean => gameAction.hasLegalTarget(context)
            )
        );
    }

    addEventsToArray(events: any[], context: AbilityContext): void {
        let properties = this.getProperties(context);
        let activePromptTitle = properties.activePromptTitle;
        let choices = Object.keys(properties.choices);
        choices = choices.filter(key => (properties.choices[key]).some(action => action.hasLegalTarget(context)));
        let choiceHandler = (choice: string): void => {
            if(properties.messages[choice]) {
                context.game.addMessage(properties.messages[choice], context.player, properties.target);
            }
            for(const gameAction of properties.choices[choice]) {
                context.game.queueSimpleStep(() => gameAction.addEventsToArray(events, context));
            }
        }
        context.game.promptWithHandlerMenu(context.player, { activePromptTitle, context, choices, choiceHandler });
    }

    canAffect(target: any, context: AbilityContext): boolean {
        let properties = this.getProperties(context);
        return Object.values(properties.choices).some(
            array => array.some(
                gameAction => gameAction.canAffect(target, context)
            )
        );
    }
}
