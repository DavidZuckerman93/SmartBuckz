import {StyleSheet} from "react-native";
import { COLORS } from './theme/colors';

const VirtualCardStyles = StyleSheet.create({
    ModalContainer :{
            backgroundColor: COLORS.primary,
           
            position: 'fixed',
            padding: 20,
            bottom: 0,
             flex: 0.7,
             height: '40vh',
            width: '100vw',
            borderTopEndRadius: 30,
            borderTopLeftRadius: 30
    },

    createButton: {
        padding: 10,
        height: 40,
        backgroundColor: COLORS.secondary,
        height: 50, padding: 10, borderWidth: 0,  borderColor: 'transparent', borderRadius: 10,
        marginTop: 10
        
    },
    textIn:{
        padding: 20,
        height: 50,
        borderRadius: 10,
        backgroundColor: COLORS.gray,
        marginBottom: 15,
        marginTop: 15,
        outlineColor: COLORS.gray
    }
});


export {VirtualCardStyles}