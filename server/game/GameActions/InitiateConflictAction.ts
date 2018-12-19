import { PlayerAction, PlayerActionProperties } from './PlayerAction';
import AbilityContext = require('../AbilityContext');
import Player = require('../player');
import Event = require('../Events/Event');
import { EventNames } from '../Constants';

export interface InitiateConflictProperties extends PlayerActionProperties {
    canPass?: boolean;
}

export class InitiateConflictAction extends PlayerAction {
    name = 'initiateConflict';
    effect = 'declare a new conflict';
    defaultProperties: InitiateConflictProperties = {
        canPass: true
    };
    constructor(properties: InitiateConflictProperties | ((context: AbilityContext) => InitiateConflictProperties)) {
        super(properties);
    }

    canAffect(player: Player, context: AbilityContext): boolean {
        let availableConflictTypes = ['military', 'political'].filter(type => player.getConflictOpportunities(type));
        if(!player.cardsInPlay.any(card => availableConflictTypes.some(type => card.canDeclareAsAttacker(type)))) {
            // No legal attackers
            return false;
        } else if(!Object.values(context.game.rings).some(ring => ring.canDeclare(player))) {
            // No legal rings
            return false;
        }
        return super.canAffect(player, context);
    }

    defaultTargets(context) {
        return [context.player];
    }

    getEvent(player: Player, context: AbilityContext): Event {
        let properties = this.getProperties(context) as InitiateConflictProperties;
        return super.createEvent(EventNames.OnConflictInitiated, {
            player: player,
            context: context
        }, () => context.game.initiateConflict(player, properties.canPass));
    }
}
